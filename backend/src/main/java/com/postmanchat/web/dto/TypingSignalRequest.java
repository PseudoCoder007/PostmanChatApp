package com.postmanchat.web.dto;

import jakarta.validation.constraints.NotNull;

public record TypingSignalRequest(
        @NotNull Boolean typing
) {
}
