package com.postmanchat.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FeedbackRequest(
        @Pattern(regexp = "^(bug|feedback|query)$", message = "Category must be bug, feedback, or query")
        String category,
        @NotBlank(message = "Subject is required")
        @Size(max = 120, message = "Subject must be 120 characters or fewer")
        String subject,
        @NotBlank(message = "Message is required")
        @Size(max = 4000, message = "Message must be 4000 characters or fewer")
        String message,
        @Size(max = 255, message = "Contact email must be 255 characters or fewer")
        String contactEmail
) {
}
