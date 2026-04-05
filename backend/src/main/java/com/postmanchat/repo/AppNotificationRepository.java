package com.postmanchat.repo;

import com.postmanchat.domain.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppNotificationRepository extends JpaRepository<AppNotification, UUID> {
    List<AppNotification> findTop30ByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<AppNotification> findByIdAndUserId(UUID id, UUID userId);
}
