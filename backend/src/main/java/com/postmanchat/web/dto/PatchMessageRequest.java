package com.postmanchat.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PatchMessageRequest(
        @NotBlank
        @Size(max = 8000)
        String content
) {
}
