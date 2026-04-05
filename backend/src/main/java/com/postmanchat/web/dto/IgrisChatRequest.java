package com.postmanchat.web.dto;

import jakarta.validation.constraints.NotBlank;

public record IgrisChatRequest(
        @NotBlank String message
) {
}
