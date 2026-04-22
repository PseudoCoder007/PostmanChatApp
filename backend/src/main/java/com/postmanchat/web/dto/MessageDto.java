package com.postmanchat.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MessageDto(
        UUID id,
        UUID roomId,
        UUID senderId,
        String senderDisplayName,
        String senderUsername,
        String content,
        AttachmentDto attachment,
        Instant createdAt,
        Instant editedAt,
        UUID replyTo,
        List<ReactionCount> reactions
) {
}
