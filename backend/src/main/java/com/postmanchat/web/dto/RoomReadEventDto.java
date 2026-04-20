package com.postmanchat.web.dto;

import java.time.Instant;
import java.util.UUID;

public record RoomReadEventDto(UUID roomId, UUID readByUserId, Instant readAt) {
}
