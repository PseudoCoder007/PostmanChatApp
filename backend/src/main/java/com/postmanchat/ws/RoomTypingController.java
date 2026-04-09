package com.postmanchat.ws;

import com.postmanchat.service.MessageService;
import com.postmanchat.web.dto.TypingSignalRequest;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
public class RoomTypingController {

    private final MessageService messageService;

    public RoomTypingController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/rooms/{roomId}/typing")
    public void typing(@DestinationVariable UUID roomId, @Valid TypingSignalRequest request) {
        messageService.broadcastTyping(roomId, Boolean.TRUE.equals(request.typing()));
    }
}
