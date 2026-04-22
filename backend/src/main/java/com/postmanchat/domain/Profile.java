package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    private UUID id;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(nullable = false)
    private String username;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column
    private String email;

    @Column(name = "last_active_at", nullable = false)
    private Instant lastActiveAt = Instant.now();

    @Column(nullable = false)
    private int xp = 0;

    @Column(nullable = false)
    private int coins = 0;

    @Column(nullable = false)
    private int level = 1;

    @Column(nullable = false)
    private String title = "Newbie";

    @Column(name = "profile_photo_unlocked", nullable = false)
    private boolean profilePhotoUnlocked = false;

    @Column(name = "friend_quests_unlocked", nullable = false)
    private boolean friendQuestsUnlocked = false;

    @Column(name = "igris_unlocked", nullable = false)
    private boolean igrisUnlocked = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "status_text", length = 80)
    private String statusText;

    @Column(name = "status_emoji", length = 8)
    private String statusEmoji;

    protected Profile() {
    }

    public Profile(UUID id, String displayName, String username, String avatarUrl) {
        this.id = id;
        this.displayName = displayName;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.lastActiveAt = Instant.now();
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Instant getLastActiveAt() {
        return lastActiveAt;
    }

    public void setLastActiveAt(Instant lastActiveAt) {
        this.lastActiveAt = lastActiveAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public int getXp() {
        return xp;
    }

    public void setXp(int xp) {
        this.xp = xp;
    }

    public int getCoins() {
        return coins;
    }

    public void setCoins(int coins) {
        this.coins = coins;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isProfilePhotoUnlocked() {
        return profilePhotoUnlocked;
    }

    public void setProfilePhotoUnlocked(boolean profilePhotoUnlocked) {
        this.profilePhotoUnlocked = profilePhotoUnlocked;
    }

    public boolean isFriendQuestsUnlocked() {
        return friendQuestsUnlocked;
    }

    public void setFriendQuestsUnlocked(boolean friendQuestsUnlocked) {
        this.friendQuestsUnlocked = friendQuestsUnlocked;
    }

    public boolean isIgrisUnlocked() {
        return igrisUnlocked;
    }

    public void setIgrisUnlocked(boolean igrisUnlocked) {
        this.igrisUnlocked = igrisUnlocked;
    }

    public String getStatusText() {
        return statusText;
    }

    public void setStatusText(String statusText) {
        this.statusText = statusText;
    }

    public String getStatusEmoji() {
        return statusEmoji;
    }

    public void setStatusEmoji(String statusEmoji) {
        this.statusEmoji = statusEmoji;
    }
}
