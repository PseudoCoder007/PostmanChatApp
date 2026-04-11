package com.postmanchat.web.dto;

import java.time.Instant;
import java.util.UUID;

public record IgrisHistoryItemDto(
        UUID id,
        String role,
        String content,
        Instant createdAt
) {
}
