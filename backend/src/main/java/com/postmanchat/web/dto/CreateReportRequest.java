package com.postmanchat.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateReportRequest(
        @NotBlank String targetType,
        @NotNull UUID targetId,
        @NotBlank String reason,
        @Size(max = 500) String notes
) {
}
