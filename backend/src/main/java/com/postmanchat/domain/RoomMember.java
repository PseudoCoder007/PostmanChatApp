package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "room_members")
public class RoomMember {

    @EmbeddedId
    private RoomMemberId id;

    @Column(nullable = false)
    private String role = "member";

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt = Instant.now();

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    @Column(nullable = false)
    private boolean muted = false;

    protected RoomMember() {
    }

    public RoomMember(RoomMemberId id, String role) {
        this.id = id;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    public RoomMemberId getId() {
        return id;
    }

    public String getRole() {
        return role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public Instant getLastReadAt() {
        return lastReadAt;
    }

    public void setLastReadAt(Instant lastReadAt) {
        this.lastReadAt = lastReadAt;
    }

    public boolean isMuted() {
        return muted;
    }

    public void setMuted(boolean muted) {
        this.muted = muted;
    }
}
