package com.postmanchat.web.dto;

public record FeedbackResponse(
        boolean sent,
        String message
) {
}
