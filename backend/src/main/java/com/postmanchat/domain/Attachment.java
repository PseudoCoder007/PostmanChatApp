package com.postmanchat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attachments")
public class Attachment {

    @Id
    private UUID id;

    @Column(name = "message_id")
    private UUID messageId;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "stored_name", nullable = false)
    private String storedName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "public_url", nullable = false)
    private String publicUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Attachment() {
    }

    public Attachment(UUID id, UUID uploadedBy, String originalName, String storedName, String contentType, long sizeBytes, String publicUrl) {
        this.id = id;
        this.uploadedBy = uploadedBy;
        this.originalName = originalName;
        this.storedName = storedName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.publicUrl = publicUrl;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getMessageId() { return messageId; }
    public void setMessageId(UUID messageId) { this.messageId = messageId; }
    public UUID getUploadedBy() { return uploadedBy; }
    public String getOriginalName() { return originalName; }
    public String getStoredName() { return storedName; }
    public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public String getPublicUrl() { return publicUrl; }
    public Instant getCreatedAt() { return createdAt; }
}
