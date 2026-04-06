package com.postmanchat.service;

import com.postmanchat.config.PostmanChatProperties;
import com.postmanchat.domain.Attachment;
import com.postmanchat.repo.AttachmentRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.AttachmentDto;
import com.postmanchat.web.dto.RegisterAttachmentRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final PostmanChatProperties properties;

    public AttachmentService(AttachmentRepository attachmentRepository, PostmanChatProperties properties) {
        this.attachmentRepository = attachmentRepository;
        this.properties = properties;
    }

    @Transactional
    public AttachmentDto upload(MultipartFile file) {
        UUID userId = Authz.requireUserId();
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Attachment file is required");
        }
        if (file.getSize() > properties.getStorage().getMaxUploadBytes()) {
            throw new IllegalArgumentException("Attachment is larger than 50 MB");
        }
        try {
            Path uploadDir = Path.of(properties.getStorage().getUploadDir()).toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);
            UUID id = UUID.randomUUID();
            String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String storedName = id + "_" + originalName.replaceAll("[^A-Za-z0-9._-]", "_");
            Path target = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            Attachment saved = attachmentRepository.save(new Attachment(
                    id,
                    userId,
                    originalName,
                    storedName,
                    file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
                    file.getSize(),
                    properties.getStorage().getBaseUrl() + "/uploads/" + storedName
            ));
            return toDto(saved);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Failed to store attachment");
        }
    }

    @Transactional
    public AttachmentDto register(RegisterAttachmentRequest request) {
        UUID userId = Authz.requireUserId();
        if (request.sizeBytes() == null || request.sizeBytes() <= 0) {
            throw new IllegalArgumentException("Attachment size is required");
        }
        if (request.sizeBytes() > properties.getStorage().getMaxUploadBytes()) {
            throw new IllegalArgumentException("Attachment is larger than 50 MB");
        }
        Attachment saved = attachmentRepository.save(new Attachment(
                UUID.randomUUID(),
                userId,
                request.originalName().trim(),
                request.storedName().trim(),
                request.contentType().trim(),
                request.sizeBytes(),
                request.publicUrl().trim()
        ));
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Attachment resolveOwnedAttachment(UUID attachmentId) {
        UUID userId = Authz.requireUserId();
        return attachmentRepository.findByIdAndUploadedBy(attachmentId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
    }

    @Transactional(readOnly = true)
    public AttachmentDto toDto(Attachment attachment) {
        if (attachment == null) {
            return null;
        }
        return new AttachmentDto(
                attachment.getId(),
                attachment.getOriginalName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                attachment.getPublicUrl(),
                attachment.getCreatedAt()
        );
    }

    @Transactional
    public void linkToMessage(UUID attachmentId, UUID messageId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
        attachment.setMessageId(messageId);
        attachmentRepository.save(attachment);
    }

    @Transactional(readOnly = true)
    public Attachment findByMessageId(UUID messageId) {
        return attachmentRepository.findFirstByMessageId(messageId).orElse(null);
    }
}
