package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    private UUID id;

    @Column(name = "submitter_id", nullable = false)
    private UUID submitterId;

    @Column(name = "target_type", nullable = false)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(nullable = false)
    private String reason;

    @Column
    private String notes;

    @Column(nullable = false)
    private String status = "open";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Report() {
    }

    public Report(UUID id, UUID submitterId, String targetType, UUID targetId, String reason, String notes) {
        this.id = id;
        this.submitterId = submitterId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
        this.notes = notes;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getSubmitterId() { return submitterId; }
    public String getTargetType() { return targetType; }
    public UUID getTargetId() { return targetId; }
    public String getReason() { return reason; }
    public String getNotes() { return notes; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
