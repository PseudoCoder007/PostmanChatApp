package com.postmanchat.web;

import com.postmanchat.service.MessageService;
import com.postmanchat.web.dto.ForwardMessageRequest;
import com.postmanchat.web.dto.MessageDto;
import com.postmanchat.web.dto.PatchMessageRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PatchMapping("/{id}")
    public MessageDto patch(@PathVariable UUID id, @Valid @RequestBody PatchMessageRequest request) {
        return messageService.updateMessage(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        messageService.deleteMessage(id);
    }

    @PostMapping("/{id}/reactions")
    public MessageDto toggleReaction(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        String emoji = body.get("emoji");
        return messageService.toggleReaction(id, emoji);
    }

    @PostMapping("/{id}/forward")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageDto forward(@PathVariable UUID id, @Valid @RequestBody ForwardMessageRequest request) {
        return messageService.forwardMessage(id, request.targetRoomId());
    }
}
