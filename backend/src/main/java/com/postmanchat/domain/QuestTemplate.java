package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "quest_templates")
public class QuestTemplate {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Column(name = "reward_xp", nullable = false)
    private int rewardXp;

    @Column(name = "reward_coins", nullable = false)
    private int rewardCoins;

    @Column(name = "min_level", nullable = false)
    private int minLevel;

    @Column(nullable = false)
    private boolean active = true;

    protected QuestTemplate() {
    }

    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public int getRewardXp() {
        return rewardXp;
    }

    public int getRewardCoins() {
        return rewardCoins;
    }

    public int getMinLevel() {
        return minLevel;
    }

    public boolean isActive() {
        return active;
    }
}
