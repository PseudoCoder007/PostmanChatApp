package com.postmanchat.web.dto;

import com.postmanchat.domain.RoomType;

import java.time.Instant;
import java.util.UUID;

public record RoomDto(
        UUID id,
        String name,
        RoomType type,
        UUID createdBy,
        Instant createdAt,
        ProfileDto directPeer
) {
}
