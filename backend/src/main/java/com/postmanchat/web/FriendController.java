package com.postmanchat.web;

import com.postmanchat.service.FriendService;
import com.postmanchat.web.dto.FriendRequestDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @GetMapping
    public List<FriendRequestDto> listFriendships() {
        return friendService.listFriendships();
    }

    @PostMapping("/{targetUserId}/request")
    public FriendRequestDto sendRequest(@PathVariable UUID targetUserId) {
        return friendService.sendRequest(targetUserId);
    }

    @PostMapping("/{otherUserId}/accept")
    public FriendRequestDto acceptRequest(@PathVariable UUID otherUserId) {
        return friendService.acceptRequest(otherUserId);
    }

    @DeleteMapping("/{otherUserId}")
    public ResponseEntity<Void> removeFriend(@PathVariable UUID otherUserId) {
        friendService.removeFriend(otherUserId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{targetUserId}/block")
    public ResponseEntity<Void> blockUser(@PathVariable UUID targetUserId) {
        friendService.blockUser(targetUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{targetUserId}/block")
    public ResponseEntity<Void> unblockUser(@PathVariable UUID targetUserId) {
        friendService.unblockUser(targetUserId);
        return ResponseEntity.noContent().build();
    }
}
