package com.postmanchat.web;

import com.postmanchat.service.MessageService;
import com.postmanchat.service.RoomService;
import com.postmanchat.web.dto.CreateRoomRequest;
import com.postmanchat.web.dto.MessageDto;
import com.postmanchat.web.dto.RoomDto;
import com.postmanchat.web.dto.SendMessageRequest;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;
    private final MessageService messageService;

    public RoomController(RoomService roomService, MessageService messageService) {
        this.roomService = roomService;
        this.messageService = messageService;
    }

    @GetMapping
    public List<RoomDto> listRooms(@RequestParam(required = false) String query) {
        return roomService.listMyRooms(query);
    }

    @PostMapping
    public RoomDto createRoom(@Valid @RequestBody CreateRoomRequest request) {
        return roomService.createRoom(request);
    }

    @GetMapping("/{roomId}/messages")
    public List<MessageDto> listMessages(
            @PathVariable UUID roomId,
            @RequestParam(required = false) Instant before,
            @RequestParam(name = "limit", defaultValue = "50") int limit
    ) {
        return messageService.listMessages(roomId, before, limit);
    }

    @PostMapping("/{roomId}/messages")
    @RateLimiter(name = "sendMessage")
    public MessageDto sendMessage(
            @PathVariable UUID roomId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return messageService.sendMessage(roomId, request);
    }
}
