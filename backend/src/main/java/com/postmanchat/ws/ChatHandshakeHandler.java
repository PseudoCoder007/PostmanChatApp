package com.postmanchat.ws;

import com.postmanchat.security.TicketHandshakeInterceptor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

@Component
public class ChatHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(
            ServerHttpRequest request,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        Object p = attributes.get(TicketHandshakeInterceptor.CHAT_USER_ATTR);
        if (p instanceof Principal principal) {
            return principal;
        }
        return null;
    }
}
