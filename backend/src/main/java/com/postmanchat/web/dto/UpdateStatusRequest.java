package com.postmanchat.web.dto;

import jakarta.validation.constraints.Size;

public record UpdateStatusRequest(
        @Size(max = 80) String statusText,
        @Size(max = 8)  String statusEmoji
) {
}
