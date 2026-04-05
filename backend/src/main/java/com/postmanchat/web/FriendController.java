package com.postmanchat.web;

import com.postmanchat.service.FriendService;
import com.postmanchat.web.dto.FriendRequestDto;
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
}
