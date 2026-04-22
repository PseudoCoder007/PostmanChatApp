package com.postmanchat.service;

import com.postmanchat.domain.Message;
import com.postmanchat.domain.PinnedMessage;
import com.postmanchat.domain.Profile;
import com.postmanchat.repo.MessageRepository;
import com.postmanchat.repo.PinnedMessageRepository;
import com.postmanchat.repo.ProfileRepository;
import com.postmanchat.repo.RoomMemberRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.PinnedMessageDto;
import com.postmanchat.web.dto.WsMessagePayload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PinService {

    private static final int MAX_PINS_PER_ROOM = 5;

    private final PinnedMessageRepository pinRepository;
    private final MessageRepository messageRepository;
    private final ProfileRepository profileRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public PinService(
            PinnedMessageRepository pinRepository,
            MessageRepository messageRepository,
            ProfileRepository profileRepository,
            RoomMemberRepository roomMemberRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.pinRepository = pinRepository;
        this.messageRepository = messageRepository;
        this.profileRepository = profileRepository;
        this.roomMemberRepository = roomMemberRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<PinnedMessageDto> listPins(UUID roomId) {
        UUID userId = Authz.requireUserId();
        assertMember(roomId, userId);
        return pinRepository.findByRoomIdOrderByPinnedAtDesc(roomId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public PinnedMessageDto pinMessage(UUID roomId, UUID messageId) {
        UUID userId = Authz.requireUserId();
        assertAdminOrOwner(roomId, userId);
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        if (!message.getRoomId().equals(roomId)) {
            throw new IllegalArgumentException("Message does not belong to this room");
        }
        if (pinRepository.findByRoomIdAndMessageId(roomId, messageId).isPresent()) {
            return toDto(pinRepository.findByRoomIdAndMessageId(roomId, messageId).get());
        }
        if (pinRepository.countByRoomId(roomId) >= MAX_PINS_PER_ROOM) {
            throw new IllegalStateException("Room has reached the maximum of " + MAX_PINS_PER_ROOM + " pinned messages");
        }
        PinnedMessage pin = new PinnedMessage(UUID.randomUUID(), roomId, messageId, userId);
        PinnedMessage saved = pinRepository.save(pin);
        PinnedMessageDto dto = toDto(saved);
        messagingTemplate.convertAndSend("/topic/rooms." + roomId,
                new WsMessagePayload("PIN_CHANGED", null, null, null));
        return dto;
    }

    @Transactional
    public void unpinMessage(UUID roomId, UUID messageId) {
        UUID userId = Authz.requireUserId();
        assertAdminOrOwner(roomId, userId);
        pinRepository.findByRoomIdAndMessageId(roomId, messageId)
                .ifPresent(pinRepository::delete);
        messagingTemplate.convertAndSend("/topic/rooms." + roomId,
                new WsMessagePayload("PIN_CHANGED", null, null, null));
    }

    private void assertMember(UUID roomId, UUID userId) {
        if (!roomMemberRepository.existsByIdRoomIdAndIdUserId(roomId, userId)) {
            throw new AccessDeniedException("Not a member of this room");
        }
    }

    private void assertAdminOrOwner(UUID roomId, UUID userId) {
        String role = roomMemberRepository.findByIdRoomIdAndIdUserId(roomId, userId)
                .map(m -> m.getRole())
                .orElseThrow(() -> new AccessDeniedException("Not a member of this room"));
        if (!"owner".equalsIgnoreCase(role) && !"admin".equalsIgnoreCase(role)) {
            throw new AccessDeniedException("Only room admins can pin messages");
        }
    }

    private PinnedMessageDto toDto(PinnedMessage pin) {
        Message message = messageRepository.findById(pin.getMessageId()).orElse(null);
        String content = message != null ? message.getContent() : "";
        String senderDisplay = "";
        if (message != null) {
            Profile sender = profileRepository.findById(message.getSenderId()).orElse(null);
            senderDisplay = sender != null ? sender.getDisplayName() : "Unknown";
        }
        return new PinnedMessageDto(pin.getId(), pin.getRoomId(), pin.getMessageId(),
                content, senderDisplay, pin.getPinnedBy(), pin.getPinnedAt());
    }
}
