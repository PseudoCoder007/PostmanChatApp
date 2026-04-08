package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomType type = RoomType.group;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false)
    private RoomVisibility visibility = RoomVisibility.public_room;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Room() {
    }

    public Room(UUID id, String name, RoomType type, UUID createdBy) {
        this(id, name, type, createdBy, RoomVisibility.public_room);
    }

    public Room(UUID id, String name, RoomType type, UUID createdBy, RoomVisibility visibility) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.createdBy = createdBy;
        this.visibility = visibility;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public RoomType getType() {
        return type;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public RoomVisibility getVisibility() {
        return visibility;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
