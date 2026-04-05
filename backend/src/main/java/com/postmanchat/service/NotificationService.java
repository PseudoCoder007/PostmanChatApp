package com.postmanchat.service;

import com.postmanchat.domain.AppNotification;
import com.postmanchat.repo.AppNotificationRepository;
import com.postmanchat.web.Authz;
import com.postmanchat.web.dto.NotificationDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final AppNotificationRepository notificationRepository;

    public NotificationService(AppNotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void notifyUser(UUID userId, String type, String title, String body, UUID roomId, UUID messageId) {
        notificationRepository.save(new AppNotification(UUID.randomUUID(), userId, type, title, body, roomId, messageId));
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> listMine() {
        UUID userId = Authz.requireUserId();
        return notificationRepository.findTop30ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public NotificationDto markRead(UUID notificationId) {
        UUID userId = Authz.requireUserId();
        AppNotification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setReadAt(Instant.now());
        return toDto(notificationRepository.save(notification));
    }

    private NotificationDto toDto(AppNotification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getBody(),
                notification.getRelatedRoomId(),
                notification.getRelatedMessageId(),
                notification.getReadAt() != null,
                notification.getCreatedAt()
        );
    }
}
