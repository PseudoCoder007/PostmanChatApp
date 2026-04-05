package com.postmanchat.repo;

import com.postmanchat.domain.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    Optional<Attachment> findByIdAndUploadedBy(UUID id, UUID uploadedBy);
    Optional<Attachment> findFirstByMessageId(UUID messageId);
}
