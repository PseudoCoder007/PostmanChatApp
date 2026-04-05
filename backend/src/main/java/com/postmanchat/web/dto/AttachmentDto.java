package com.postmanchat.web.dto;

import java.time.Instant;
import java.util.UUID;

public record AttachmentDto(
        UUID id,
        String originalName,
        String contentType,
        long sizeBytes,
        String publicUrl,
        Instant createdAt
) {
}
