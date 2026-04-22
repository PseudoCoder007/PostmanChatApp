package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pinned_messages")
public class PinnedMessage {

    @Id
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "pinned_by", nullable = false)
    private UUID pinnedBy;

    @Column(name = "pinned_at", nullable = false)
    private Instant pinnedAt = Instant.now();

    protected PinnedMessage() {
    }

    public PinnedMessage(UUID id, UUID roomId, UUID messageId, UUID pinnedBy) {
        this.id = id;
        this.roomId = roomId;
        this.messageId = messageId;
        this.pinnedBy = pinnedBy;
        this.pinnedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getRoomId() { return roomId; }
    public UUID getMessageId() { return messageId; }
    public UUID getPinnedBy() { return pinnedBy; }
    public Instant getPinnedAt() { return pinnedAt; }
}
