package com.postmanchat.repo;

import java.time.Instant;
import java.util.UUID;

public interface RoomLastMessage {
    UUID getRoomId();
    Instant getLastAt();
}
