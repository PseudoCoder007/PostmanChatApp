package com.postmanchat.security;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class TicketHandshakeInterceptor implements HandshakeInterceptor {

    public static final String CHAT_USER_ATTR = "chatUserPrincipal";

    private final WsTicketService wsTicketService;

    public TicketHandshakeInterceptor(WsTicketService wsTicketService) {
        this.wsTicketService = wsTicketService;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }
        String ticket = servletRequest.getServletRequest().getParameter("ticket");
        return wsTicketService.consume(ticket)
                .map(userId -> {
                    attributes.put(CHAT_USER_ATTR, new ChatUserPrincipal(userId));
                    return true;
                })
                .orElse(false);
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // no-op
    }
}
