package com.postmanchat.web.dto;

import java.time.Instant;

public record FriendRequestDto(ProfileDto profile, String friendshipState, Instant createdAt) {
}
