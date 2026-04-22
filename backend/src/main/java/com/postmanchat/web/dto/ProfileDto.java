package com.postmanchat.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ProfileDto(
        UUID id,
        String displayName,
        String username,
        String avatarUrl,
        Instant createdAt,
        Instant lastActiveAt,
        boolean active,
        String friendshipState,
        int xp,
        int coins,
        int level,
        String title,
        boolean profilePhotoUnlocked,
        boolean canChallengeFriends,
        boolean canUseIgris,
        String statusText,
        String statusEmoji
) {
}
