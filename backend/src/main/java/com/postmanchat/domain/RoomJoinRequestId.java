package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class RoomJoinRequestId implements Serializable {

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    protected RoomJoinRequestId() {
    }

    public RoomJoinRequestId(UUID roomId, UUID userId) {
        this.roomId = roomId;
        this.userId = userId;
    }

    public UUID getRoomId() {
        return roomId;
    }

    public UUID getUserId() {
        return userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RoomJoinRequestId that)) return false;
        return Objects.equals(roomId, that.roomId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(roomId, userId);
    }
}
