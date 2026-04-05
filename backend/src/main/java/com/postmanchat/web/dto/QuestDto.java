package com.postmanchat.web.dto;

import java.time.Instant;
import java.util.UUID;

public record QuestDto(
        UUID id,
        String code,
        String title,
        String description,
        int rewardXp,
        int rewardCoins,
        String status,
        String triggerType,
        String triggerTarget,
        boolean autoCompletes,
        String source,
        Instant assignedAt,
        Instant completedAt
) {
}
