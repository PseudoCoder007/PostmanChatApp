package com.postmanchat.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ForwardMessageRequest(@NotNull UUID targetRoomId) {
}
