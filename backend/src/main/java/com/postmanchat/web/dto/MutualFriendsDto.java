package com.postmanchat.web.dto;

import java.util.List;

public record MutualFriendsDto(int count, List<ProfileDto> samples) {
}
