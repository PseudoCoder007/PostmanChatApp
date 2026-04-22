package com.postmanchat.web.dto;

import com.postmanchat.domain.RoomType;
import com.postmanchat.domain.RoomVisibility;

import java.time.Instant;
import java.util.UUID;

public record RoomDto(
        UUID id,
        String name,
        RoomType type,
        UUID createdBy,
        Instant createdAt,
        ProfileDto directPeer,
        RoomVisibility visibility,
        boolean member,
        String currentUserRole,
        long memberCount,
        Instant peerLastReadAt,
        boolean muted
) {
}
