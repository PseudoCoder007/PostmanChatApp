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
@Table(name = "user_quests")
public class UserQuest {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserQuestStatus status = UserQuestStatus.assigned;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    protected UserQuest() {
    }

    public UserQuest(UUID id, UUID userId, UUID templateId) {
        this.id = id;
        this.userId = userId;
        this.templateId = templateId;
        this.status = UserQuestStatus.assigned;
        this.assignedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getTemplateId() {
        return templateId;
    }

    public UserQuestStatus getStatus() {
        return status;
    }

    public void setStatus(UserQuestStatus status) {
        this.status = status;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
