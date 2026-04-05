package com.postmanchat.web.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        String type,
        String title,
        String body,
        UUID relatedRoomId,
        UUID relatedMessageId,
        boolean read,
        Instant createdAt
) {
}
