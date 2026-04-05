package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class FriendshipId implements Serializable {

    @Column(name = "user_low_id", nullable = false)
    private UUID userLowId;

    @Column(name = "user_high_id", nullable = false)
    private UUID userHighId;

    protected FriendshipId() {
    }

    public FriendshipId(UUID userLowId, UUID userHighId) {
        this.userLowId = userLowId;
        this.userHighId = userHighId;
    }

    public UUID getUserLowId() {
        return userLowId;
    }

    public UUID getUserHighId() {
        return userHighId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof FriendshipId that)) {
            return false;
        }
        return Objects.equals(userLowId, that.userLowId) && Objects.equals(userHighId, that.userHighId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userLowId, userHighId);
    }
}
