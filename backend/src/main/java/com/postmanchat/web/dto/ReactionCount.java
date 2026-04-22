package com.postmanchat.web.dto;

public record ReactionCount(String emoji, long count, boolean reactedByMe) {
}
