package com.postmanchat.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterAttachmentRequest(
        @NotBlank @Size(max = 300) String originalName,
        @NotBlank @Size(max = 300) String storedName,
        @NotBlank @Size(max = 200) String contentType,
        @NotNull Long sizeBytes,
        @NotBlank @Size(max = 2000) String publicUrl
) {
}
