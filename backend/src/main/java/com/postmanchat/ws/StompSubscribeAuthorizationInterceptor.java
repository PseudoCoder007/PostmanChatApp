package com.postmanchat.ws;

import com.postmanchat.repo.RoomMemberRepository;
import com.postmanchat.security.ChatUserPrincipal;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.UUID;

@Component
public class StompSubscribeAuthorizationInterceptor implements ChannelInterceptor {

    private static final String TOPIC_ROOMS_PREFIX = "/topic/rooms.";

    private final RoomMemberRepository roomMemberRepository;

    public StompSubscribeAuthorizationInterceptor(RoomMemberRepository roomMemberRepository) {
        this.roomMemberRepository = roomMemberRepository;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }
        if (!StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            return message;
        }
        String dest = accessor.getDestination();
        if (dest == null || !dest.startsWith(TOPIC_ROOMS_PREFIX)) {
            return message;
        }
        UUID roomId;
        try {
            roomId = UUID.fromString(dest.substring(TOPIC_ROOMS_PREFIX.length()));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid room topic");
        }
        Principal user = accessor.getUser();
        UUID userId = null;
        if (user instanceof ChatUserPrincipal cup) {
            userId = cup.userId();
        } else if (user != null) {
            userId = UUID.fromString(user.getName());
        }
        if (userId == null || !roomMemberRepository.existsByIdRoomIdAndIdUserId(roomId, userId)) {
            throw new SecurityException("Not allowed to subscribe to this room");
        }
        return message;
    }
}
