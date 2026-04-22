package com.postmanchat.web.dto;

import java.time.Instant;
import java.util.UUID;

public record PinnedMessageDto(
        UUID id,
        UUID roomId,
        UUID messageId,
        String messageContent,
        String senderDisplayName,
        UUID pinnedBy,
        Instant pinnedAt
) {
}
