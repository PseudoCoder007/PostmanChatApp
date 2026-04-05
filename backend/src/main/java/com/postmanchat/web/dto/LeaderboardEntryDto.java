package com.postmanchat.web.dto;

public record LeaderboardEntryDto(
        int rank,
        ProfileDto profile
) {
}
