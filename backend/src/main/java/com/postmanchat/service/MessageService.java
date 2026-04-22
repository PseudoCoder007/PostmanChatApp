package com.postmanchat.service;

import com.postmanchat.config.PostmanChatProperties;
import com.postmanchat.domain.Attachment;
import com.postmanchat.domain.Message;
import com.postmanchat.domain.MessageReaction;
import com.postmanchat.domain.Profile;
import com.postmanchat.domain.Room;
import com.postmanchat.domain.RoomType;
import com.postmanchat.repo.MessageReactionRepository;
import com.postmanchat.repo.MessageRepository;
import com.postmanchat.repo.ProfileRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.MessageDto;
import com.postmanchat.web.dto.PatchMessageRequest;
import com.postmanchat.web.dto.ReactionCount;
import com.postmanchat.web.dto.SendMessageRequest;
import com.postmanchat.web.dto.TypingEventDto;
import com.postmanchat.web.dto.WsMessagePayload;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
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
    private final FriendService friendService;
    private final MessageReactionRepository reactionRepository;

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
            QuestService questService,
            FriendService friendService,
            MessageReactionRepository reactionRepository
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
        this.friendService = friendService;
        this.reactionRepository = reactionRepository;
    }

    @Transactional(readOnly = true)
    public List<MessageDto> searchMessages(UUID roomId, String query, int limit) {
        UUID userId = Authz.requireUserId();
        roomService.assertMember(roomId, userId);
        if (query == null || query.isBlank()) return List.of();
        int capped = Math.max(1, Math.min(limit, 50));
        List<Message> raw = messageRepository.searchInRoom(roomId, query.trim(), PageRequest.of(0, capped));
        List<Message> chronological = new java.util.ArrayList<>(raw);
        Collections.reverse(chronological);
        return toMessageDtos(chronological);
    }

    @Transactional(readOnly = true)
    public List<MessageDto> listMessages(UUID roomId, Instant before, int limit) {
        UUID userId = Authz.requireUserId();
        roomService.assertMember(roomId, userId);
        int capped = Math.max(1, Math.min(limit, 100));
        List<Message> raw = before == null
                ? messageRepository.findPageForRoom(roomId, PageRequest.of(0, capped))
                : messageRepository.findPageForRoomBefore(roomId, before, PageRequest.of(0, capped));
        List<Message> chronological = raw.stream().toList();
        List<Message> mutable = new java.util.ArrayList<>(chronological);
        Collections.reverse(mutable);
        return toMessageDtos(mutable);
    }

    @Transactional
    public MessageDto sendMessage(UUID roomId, SendMessageRequest request) {
        UUID userId = Authz.requireUserId();
        roomService.assertMember(roomId, userId);
        Room roomForBlockCheck = roomService.findRoom(roomId);
        if (roomForBlockCheck.getType() == RoomType.direct) {
            UUID peerId = roomMemberRepository.findByIdRoomId(roomId).stream()
                    .map(m -> m.getId().getUserId())
                    .filter(id -> !id.equals(userId))
                    .findFirst().orElseThrow();
            if (friendService.isBlockedBetween(userId, peerId)) {
                throw new AccessDeniedException("Cannot send message — one user has blocked the other");
            }
        }
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
        detectAndNotifyMentions(saved, roomId, userId);
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
                messageId, roomId, userId, senderDisplayName, senderUsername, "", null, message.getCreatedAt(), message.getEditedAt(), message.getReplyTo(), List.of(), null
        );
        messagingTemplate.convertAndSend(topic(roomId), new WsMessagePayload("MESSAGE_DELETED", tombstone));
    }

    @Transactional(readOnly = true)
    public void broadcastTyping(UUID roomId, boolean typing) {
        UUID userId = Authz.requireUserId();
        roomService.assertMember(roomId, userId);
        Profile sender = profileRepository.findById(userId).orElse(fallbackProfile(userId));
        messagingTemplate.convertAndSend(
                topic(roomId),
                new WsMessagePayload("TYPING", new TypingEventDto(roomId, userId, sender.getDisplayName(), typing))
        );
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

    @Transactional
    public MessageDto toggleReaction(UUID messageId, String emoji) {
        UUID userId = Authz.requireUserId();
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        roomService.assertMember(message.getRoomId(), userId);
        if (emoji == null || emoji.isBlank() || emoji.length() > 32) {
            throw new IllegalArgumentException("Invalid emoji");
        }
        List<MessageReaction> existingReactions = reactionRepository.findByMessageIdAndUserId(messageId, userId);
        Optional<MessageReaction> sameEmoji = existingReactions.stream()
                .filter(reaction -> reaction.getEmoji().equals(emoji))
                .findFirst();
        if (sameEmoji.isPresent()) {
            reactionRepository.delete(sameEmoji.get());
        } else {
            if (!existingReactions.isEmpty()) {
                reactionRepository.deleteAll(existingReactions);
            }
            reactionRepository.save(new MessageReaction(UUID.randomUUID(), messageId, userId, emoji));
        }
        MessageDto dto = toMessageDto(message);
        messagingTemplate.convertAndSend(topic(message.getRoomId()), new WsMessagePayload("REACTION_UPDATE", dto));
        return dto;
    }

    @Transactional
    public MessageDto forwardMessage(UUID messageId, UUID targetRoomId) {
        UUID userId = Authz.requireUserId();
        Message original = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        roomService.assertMember(original.getRoomId(), userId);
        roomService.assertMember(targetRoomId, userId);
        Room targetRoom = roomService.findRoom(targetRoomId);
        if (targetRoom.getType() == RoomType.direct) {
            UUID peerId = roomMemberRepository.findByIdRoomId(targetRoomId).stream()
                    .map(m -> m.getId().getUserId())
                    .filter(id -> !id.equals(userId))
                    .findFirst().orElseThrow();
            if (friendService.isBlockedBetween(userId, peerId)) {
                throw new AccessDeniedException("Cannot forward — one user has blocked the other");
            }
        }
        String body = original.getContent() == null ? "" : original.getContent();
        Message forwarded = new Message(UUID.randomUUID(), targetRoomId, userId, body);
        forwarded.setForwardedFromId(messageId);
        Message saved = messageRepository.save(forwarded);
        MessageDto dto = toMessageDto(saved);
        messagingTemplate.convertAndSend(topic(targetRoomId), new WsMessagePayload("MESSAGE_CREATED", dto));
        return dto;
    }

    private List<MessageDto> toMessageDtos(List<Message> messages) {
        UUID currentUserId = Authz.requireUserId();
        Set<UUID> msgIds = messages.stream().map(Message::getId).collect(Collectors.toSet());
        Map<UUID, List<MessageReaction>> reactionsPerMessage = reactionRepository.findByMessageIdIn(msgIds).stream()
                .collect(Collectors.groupingBy(MessageReaction::getMessageId));
        Set<UUID> senderIds = messages.stream().map(Message::getSenderId).collect(Collectors.toSet());
        Map<UUID, Profile> senders = profileRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(Profile::getId, profile -> profile));
        return messages.stream()
                .map(message -> DtoMapper.toAttachmentMessageDto(
                        message,
                        senders.getOrDefault(message.getSenderId(), fallbackProfile(message.getSenderId())).getDisplayName(),
                        senders.getOrDefault(message.getSenderId(), fallbackProfile(message.getSenderId())).getUsername(),
                        resolveAttachmentDto(message.getId()),
                        buildReactionCounts(reactionsPerMessage.getOrDefault(message.getId(), List.of()), currentUserId)
                ))
                .toList();
    }

    private MessageDto toMessageDto(Message message) {
        UUID currentUserId = Authz.requireUserId();
        Profile sender = profileRepository.findById(message.getSenderId()).orElse(fallbackProfile(message.getSenderId()));
        List<MessageReaction> reactions = reactionRepository.findByMessageId(message.getId());
        return DtoMapper.toAttachmentMessageDto(message, sender.getDisplayName(), sender.getUsername(),
                resolveAttachmentDto(message.getId()), buildReactionCounts(reactions, currentUserId));
    }

    private List<ReactionCount> buildReactionCounts(List<MessageReaction> reactions, UUID currentUserId) {
        Map<String, Long> counts = reactions.stream()
                .collect(Collectors.groupingBy(MessageReaction::getEmoji, Collectors.counting()));
        Set<String> mine = reactions.stream()
                .filter(r -> r.getUserId().equals(currentUserId))
                .map(MessageReaction::getEmoji)
                .collect(Collectors.toSet());
        return counts.entrySet().stream()
                .map(e -> new ReactionCount(e.getKey(), e.getValue(), mine.contains(e.getKey())))
                .toList();
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
                .filter(member -> !member.getId().getUserId().equals(message.getSenderId()))
                .filter(member -> !member.isMuted())
                .forEach(member -> {
                    UUID memberId = member.getId().getUserId();
                    profileRepository.findById(memberId).ifPresent(profile -> {
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
                    });
                });
    }

    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w{1,50})");

    private void detectAndNotifyMentions(Message message, UUID roomId, UUID senderId) {
        if (message.getContent() == null || message.getContent().isBlank()) return;
        Matcher matcher = MENTION_PATTERN.matcher(message.getContent());
        Set<String> seen = new HashSet<>();
        while (matcher.find()) {
            String username = matcher.group(1);
            if (!seen.add(username.toLowerCase())) continue;
            profileRepository.findByUsernameIgnoreCase(username).ifPresent(profile -> {
                if (!profile.getId().equals(senderId) &&
                        roomMemberRepository.existsByIdRoomIdAndIdUserId(roomId, profile.getId())) {
                    Profile senderProfile = profileRepository.findById(senderId).orElse(null);
                    String senderName = senderProfile != null ? senderProfile.getDisplayName() : "Someone";
                    notificationService.notifyUser(
                            profile.getId(),
                            "mention",
                            senderName + " mentioned you",
                            message.getContent(),
                            roomId,
                            message.getId()
                    );
                }
            });
        }
    }
}
