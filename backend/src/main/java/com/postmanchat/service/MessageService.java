package com.postmanchat.service;

import com.postmanchat.config.PostmanChatProperties;
import com.postmanchat.domain.Attachment;
import com.postmanchat.domain.Message;
import com.postmanchat.domain.Profile;
import com.postmanchat.domain.Room;
import com.postmanchat.repo.MessageRepository;
import com.postmanchat.repo.ProfileRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.MessageDto;
import com.postmanchat.web.dto.PatchMessageRequest;
import com.postmanchat.web.dto.SendMessageRequest;
import com.postmanchat.web.dto.WsMessagePayload;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private static final Pattern ANGLE_BRACKETS = Pattern.compile("[<>]");

    private final MessageRepository messageRepository;
    private final ProfileRepository profileRepository;
    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;
    private final PostmanChatProperties properties;
    private final ProgressionService progressionService;
    private final AttachmentService attachmentService;
    private final NotificationService notificationService;
    private final com.postmanchat.repo.RoomMemberRepository roomMemberRepository;
    private final QuestService questService;

    public MessageService(
            MessageRepository messageRepository,
            ProfileRepository profileRepository,
            RoomService roomService,
            SimpMessagingTemplate messagingTemplate,
            PostmanChatProperties properties,
            ProgressionService progressionService,
            AttachmentService attachmentService,
            NotificationService notificationService,
            com.postmanchat.repo.RoomMemberRepository roomMemberRepository,
            QuestService questService
    ) {
        this.messageRepository = messageRepository;
        this.profileRepository = profileRepository;
        this.roomService = roomService;
        this.messagingTemplate = messagingTemplate;
        this.properties = properties;
        this.progressionService = progressionService;
        this.attachmentService = attachmentService;
        this.notificationService = notificationService;
        this.roomMemberRepository = roomMemberRepository;
        this.questService = questService;
    }

    @Transactional(readOnly = true)
    public List<MessageDto> listMessages(UUID roomId, Instant before, int limit) {
        UUID userId = Authz.requireUserId();
        roomService.assertMember(roomId, userId);
        int capped = Math.max(1, Math.min(limit, 100));
        List<Message> raw = messageRepository.findPageForRoom(roomId, before, PageRequest.of(0, capped));
        List<Message> chronological = raw.stream().toList();
        List<Message> mutable = new java.util.ArrayList<>(chronological);
        Collections.reverse(mutable);
        return toMessageDtos(mutable);
    }

    @Transactional
    public MessageDto sendMessage(UUID roomId, SendMessageRequest request) {
        UUID userId = Authz.requireUserId();
        roomService.assertMember(roomId, userId);
        String body = sanitizeContent(request.content(), request.attachmentId());
        UUID replyTo = request.replyTo();
        Attachment attachment = request.attachmentId() != null ? attachmentService.resolveOwnedAttachment(request.attachmentId()) : null;
        if (replyTo != null) {
            Message parent = messageRepository.findById(replyTo).orElseThrow(() ->
                    new IllegalArgumentException("replyTo message not found"));
            if (!parent.getRoomId().equals(roomId)) {
                throw new IllegalArgumentException("Must be in the same room");
            }
        }
        Message message = new Message(UUID.randomUUID(), roomId, userId, body);
        message.setReplyTo(replyTo);
        Message saved = messageRepository.save(message);
        if (attachment != null) {
            attachmentService.linkToMessage(attachment.getId(), saved.getId());
        }
        profileRepository.findById(userId).ifPresent(profile -> {
            progressionService.grantRewards(profile, 5, 1);
            profileRepository.save(profile);
        });
        Room room = roomService.findRoom(roomId);
        questService.handleMessageActivity(userId, room, body, attachment);
        MessageDto dto = toMessageDto(saved);
        createNotificationsForInactiveMembers(saved, dto);
        messagingTemplate.convertAndSend(topic(roomId), new WsMessagePayload("MESSAGE_CREATED", dto));
        return dto;
    }

    @Transactional
    public MessageDto updateMessage(UUID messageId, PatchMessageRequest request) {
        UUID userId = Authz.requireUserId();
        Message message = messageRepository.findById(messageId).orElseThrow(() ->
                new IllegalArgumentException("Message not found"));
        roomService.assertMember(message.getRoomId(), userId);
        if (!message.getSenderId().equals(userId)) {
            throw new AccessDeniedException("Only the author can edit this message");
        }
        message.setContent(sanitizeContent(request.content(), null));
        message.setEditedAt(Instant.now());
        Message saved = messageRepository.save(message);
        MessageDto dto = toMessageDto(saved);
        messagingTemplate.convertAndSend(topic(message.getRoomId()), new WsMessagePayload("MESSAGE_UPDATED", dto));
        return dto;
    }

    @Transactional
    public void deleteMessage(UUID messageId) {
        UUID userId = Authz.requireUserId();
        Message message = messageRepository.findById(messageId).orElseThrow(() ->
                new IllegalArgumentException("Message not found"));
        roomService.assertMember(message.getRoomId(), userId);
        if (!message.getSenderId().equals(userId)) {
            throw new AccessDeniedException("Only the author can delete this message");
        }
        UUID roomId = message.getRoomId();
        messageRepository.delete(message);
        Profile sender = profileRepository.findById(message.getSenderId()).orElse(null);
        String senderDisplayName = sender != null ? sender.getDisplayName() : "Unknown user";
        String senderUsername = sender != null ? sender.getUsername() : "unknown";
        MessageDto tombstone = new MessageDto(
                messageId, roomId, userId, senderDisplayName, senderUsername, "", null, message.getCreatedAt(), message.getEditedAt(), message.getReplyTo()
        );
        messagingTemplate.convertAndSend(topic(roomId), new WsMessagePayload("MESSAGE_DELETED", tombstone));
    }

    private String sanitizeContent(String raw, UUID attachmentId) {
        String safe = raw == null ? "" : raw.trim();
        if (safe.isBlank() && attachmentId == null) {
            throw new IllegalArgumentException("content or attachment required");
        }
        String trimmed = safe;
        int max = properties.getMessages().getMaxContentLength();
        if (trimmed.length() > max) {
            throw new IllegalArgumentException("Message too long");
        }
        if (ANGLE_BRACKETS.matcher(trimmed).find()) {
            throw new IllegalArgumentException("Angle brackets are not allowed in messages");
        }
        return trimmed;
    }

    private static String topic(UUID roomId) {
        return "/topic/rooms." + roomId;
    }

    private List<MessageDto> toMessageDtos(List<Message> messages) {
        Set<UUID> senderIds = messages.stream().map(Message::getSenderId).collect(Collectors.toSet());
        Map<UUID, Profile> senders = profileRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(Profile::getId, profile -> profile));
        return messages.stream()
                .map(message -> DtoMapper.toAttachmentMessageDto(
                        message,
                        senders.getOrDefault(message.getSenderId(), fallbackProfile(message.getSenderId())).getDisplayName(),
                        senders.getOrDefault(message.getSenderId(), fallbackProfile(message.getSenderId())).getUsername(),
                        resolveAttachmentDto(message.getId())
                ))
                .toList();
    }

    private MessageDto toMessageDto(Message message) {
        Profile sender = profileRepository.findById(message.getSenderId()).orElse(fallbackProfile(message.getSenderId()));
        return DtoMapper.toAttachmentMessageDto(message, sender.getDisplayName(), sender.getUsername(), resolveAttachmentDto(message.getId()));
    }

    private static Profile fallbackProfile(UUID senderId) {
        return new Profile(senderId, "Unknown user", "unknown", null);
    }

    private com.postmanchat.web.dto.AttachmentDto resolveAttachmentDto(UUID messageId) {
        return attachmentService.toDto(
                attachmentService.findByMessageId(messageId)
        );
    }

    private void createNotificationsForInactiveMembers(Message message, MessageDto dto) {
        Profile sender = profileRepository.findById(message.getSenderId()).orElse(null);
        String senderName = sender != null ? sender.getDisplayName() : "Someone";
        roomMemberRepository.findByIdRoomId(message.getRoomId()).stream()
                .map(member -> member.getId().getUserId())
                .filter(memberId -> !memberId.equals(message.getSenderId()))
                .forEach(memberId -> profileRepository.findById(memberId).ifPresent(profile -> {
                    if (profile.getLastActiveAt() == null || profile.getLastActiveAt().isBefore(Instant.now().minusSeconds(120))) {
                        notificationService.notifyUser(
                                memberId,
                                "message",
                                "New message from " + senderName,
                                dto.content().isBlank() ? "Sent an attachment" : dto.content(),
                                message.getRoomId(),
                                message.getId()
                        );
                    }
                }));
    }
}
