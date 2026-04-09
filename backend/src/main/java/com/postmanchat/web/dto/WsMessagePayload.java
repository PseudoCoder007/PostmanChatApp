package com.postmanchat.web.dto;

public record WsMessagePayload(String type, MessageDto message, TypingEventDto typing) {

    public WsMessagePayload(String type, MessageDto message) {
        this(type, message, null);
    }

    public WsMessagePayload(String type, TypingEventDto typing) {
        this(type, null, typing);
    }
}
