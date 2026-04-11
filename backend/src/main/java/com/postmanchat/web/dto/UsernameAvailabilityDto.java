package com.postmanchat.web.dto;

public record UsernameAvailabilityDto(
        String username,
        boolean available
) {
}
