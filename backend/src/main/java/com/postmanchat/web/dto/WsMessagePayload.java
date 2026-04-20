package com.postmanchat.web.dto;

public record WsMessagePayload(String type, MessageDto message, TypingEventDto typing, RoomReadEventDto roomRead) {

    public WsMessagePayload(String type, MessageDto message) {
        this(type, message, null, null);
    }

    public WsMessagePayload(String type, TypingEventDto typing) {
        this(type, null, typing, null);
    }

    public WsMessagePayload(String type, RoomReadEventDto roomRead) {
        this(type, null, null, roomRead);
    }
}
