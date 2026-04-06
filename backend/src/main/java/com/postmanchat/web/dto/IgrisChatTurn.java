package com.postmanchat.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record IgrisChatTurn(
        @NotBlank
        @Pattern(regexp = "user|assistant", message = "Role must be user or assistant")
        String role,
        @NotBlank String content
) {
}
