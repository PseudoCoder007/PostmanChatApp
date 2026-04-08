package com.postmanchat.web.dto;

import java.time.Instant;
import java.util.UUID;

public record RoomJoinRequestDto(
        UUID roomId,
        ProfileDto profile,
        String status,
        Instant createdAt
) {
}
