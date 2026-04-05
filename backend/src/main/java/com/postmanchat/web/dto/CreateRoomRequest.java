package com.postmanchat.web.dto;

import com.postmanchat.domain.RoomType;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateRoomRequest(
        @Size(max = 200) String name,
        RoomType type,
        UUID targetUserId
) {
}
