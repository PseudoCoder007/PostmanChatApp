package com.postmanchat.web;

import com.postmanchat.service.NotificationService;
import com.postmanchat.web.dto.NotificationDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationDto> listMine() {
        return notificationService.listMine();
    }

    @PostMapping("/{notificationId}/read")
    public NotificationDto markRead(@PathVariable UUID notificationId) {
        return notificationService.markRead(notificationId);
    }
}
