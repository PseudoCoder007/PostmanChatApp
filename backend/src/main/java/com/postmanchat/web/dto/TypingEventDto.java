package com.postmanchat.web.dto;

import java.util.UUID;

public record TypingEventDto(
        UUID roomId,
        UUID userId,
        String displayName,
        boolean typing
) {
}
