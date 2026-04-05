package com.postmanchat.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
        @Size(max = 8000)
        String content,
        java.util.UUID replyTo,
        java.util.UUID attachmentId
) {
}
