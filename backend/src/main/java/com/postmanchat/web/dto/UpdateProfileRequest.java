package com.postmanchat.web.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 2, max = 80) String displayName,
        @Pattern(regexp = "^[a-z0-9_]{3,24}$", message = "Username must be 3-24 chars: lowercase letters, numbers, underscore")
        String username,
        @Size(max = 1000) String avatarUrl
) {
}
