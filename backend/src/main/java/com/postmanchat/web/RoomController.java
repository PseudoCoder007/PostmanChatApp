package com.postmanchat.web;

import com.postmanchat.service.MessageService;
import com.postmanchat.service.RoomService;
import com.postmanchat.web.dto.CreateRoomRequest;
import com.postmanchat.web.dto.MessageDto;
import com.postmanchat.web.dto.RoomJoinRequestDto;
import com.postmanchat.web.dto.RoomDto;
import com.postmanchat.web.dto.SendMessageRequest;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/discover")
    public List<RoomDto> discoverRooms(@RequestParam(required = false) String query) {
        return roomService.discoverRooms(query);
    }

    @PostMapping
    public RoomDto createRoom(@Valid @RequestBody CreateRoomRequest request) {
        return roomService.createRoom(request);
    }

    @PostMapping("/{roomId}/join")
    public RoomDto joinRoom(@PathVariable UUID roomId) {
        return roomService.joinOrRequestAccess(roomId);
    }

    @GetMapping("/{roomId}/requests")
    public List<RoomJoinRequestDto> listJoinRequests(@PathVariable UUID roomId) {
        return roomService.listJoinRequests(roomId);
    }

    @PostMapping("/{roomId}/requests/{userId}/approve")
    public RoomDto approveJoinRequest(@PathVariable UUID roomId, @PathVariable UUID userId) {
        return roomService.approveJoinRequest(roomId, userId);
    }

    @PostMapping("/{roomId}/requests/{userId}/reject")
    public void rejectJoinRequest(@PathVariable UUID roomId, @PathVariable UUID userId) {
        roomService.rejectJoinRequest(roomId, userId);
    }

    @PostMapping("/{roomId}/members")
    public RoomDto addRoomMember(@PathVariable UUID roomId, @RequestParam UUID targetUserId) {
        return roomService.addMember(roomId, targetUserId);
    }

    @PostMapping("/{roomId}/read")
    public ResponseEntity<Void> markRoomRead(@PathVariable UUID roomId) {
        roomService.markRoomRead(roomId);
        return ResponseEntity.noContent().build();
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
