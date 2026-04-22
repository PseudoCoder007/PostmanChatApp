package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "message_reactions")
public class MessageReaction {

    @Id
    private UUID id;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 32)
    private String emoji;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected MessageReaction() {
    }

    public MessageReaction(UUID id, UUID messageId, UUID userId, String emoji) {
        this.id = id;
        this.messageId = messageId;
        this.userId = userId;
        this.emoji = emoji;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getMessageId() { return messageId; }
    public UUID getUserId() { return userId; }
    public String getEmoji() { return emoji; }
    public Instant getCreatedAt() { return createdAt; }
}
