package com.postmanchat.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record IgrisChatRequest(
        @NotBlank String message,
        @Valid List<IgrisChatTurn> history
) {
}
