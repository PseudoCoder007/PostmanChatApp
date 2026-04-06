package com.postmanchat.service;

import com.postmanchat.domain.Message;
import com.postmanchat.domain.Profile;
import com.postmanchat.domain.Room;
import com.postmanchat.web.dto.AttachmentDto;
import com.postmanchat.web.dto.MessageDto;
import com.postmanchat.web.dto.ProfileDto;
import com.postmanchat.web.dto.RoomDto;

public final class DtoMapper {

    private static final long ACTIVE_WINDOW_SECONDS = 300;

    private DtoMapper() {
    }

    public static ProfileDto toProfileDto(Profile p, String friendshipState) {
        boolean active = p.getLastActiveAt() != null && p.getLastActiveAt().isAfter(java.time.Instant.now().minusSeconds(ACTIVE_WINDOW_SECONDS));
        return new ProfileDto(
                p.getId(),
                p.getDisplayName(),
                p.getUsername(),
                p.getAvatarUrl(),
                p.getCreatedAt(),
                p.getLastActiveAt(),
                active,
                friendshipState,
                p.getXp(),
                p.getCoins(),
                p.getLevel(),
                p.getTitle(),
                p.isProfilePhotoUnlocked(),
                p.isFriendQuestsUnlocked(),
                p.isIgrisUnlocked()
        );
    }

    public static RoomDto toRoomDto(Room r, ProfileDto directPeer) {
        return new RoomDto(r.getId(), r.getName(), r.getType(), r.getCreatedBy(), r.getCreatedAt(), directPeer);
    }

    public static MessageDto toAttachmentMessageDto(Message m, String senderDisplayName, String senderUsername, AttachmentDto attachment) {
        return new MessageDto(
                m.getId(),
                m.getRoomId(),
                m.getSenderId(),
                senderDisplayName,
                senderUsername,
                m.getContent(),
                attachment,
                m.getCreatedAt(),
                m.getEditedAt(),
                m.getReplyTo()
        );
    }
}
