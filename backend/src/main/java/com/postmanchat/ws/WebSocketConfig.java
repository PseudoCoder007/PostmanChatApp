package com.postmanchat.ws;

import com.postmanchat.config.PostmanChatProperties;
import com.postmanchat.security.TicketHandshakeInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final TicketHandshakeInterceptor ticketHandshakeInterceptor;
    private final ChatHandshakeHandler chatHandshakeHandler;
    private final StompSubscribeAuthorizationInterceptor stompSubscribeAuthorizationInterceptor;
    private final PostmanChatProperties postmanChatProperties;

    public WebSocketConfig(
            TicketHandshakeInterceptor ticketHandshakeInterceptor,
            ChatHandshakeHandler chatHandshakeHandler,
            StompSubscribeAuthorizationInterceptor stompSubscribeAuthorizationInterceptor,
            PostmanChatProperties postmanChatProperties
    ) {
        this.ticketHandshakeInterceptor = ticketHandshakeInterceptor;
        this.chatHandshakeHandler = chatHandshakeHandler;
        this.stompSubscribeAuthorizationInterceptor = stompSubscribeAuthorizationInterceptor;
        this.postmanChatProperties = postmanChatProperties;
    }

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        List<String> origins = postmanChatProperties.getCors().getAllowedOrigins();
        String[] patterns = origins.toArray(String[]::new);
        registry.addEndpoint("/ws")
                .setHandshakeHandler(chatHandshakeHandler)
                .setAllowedOriginPatterns(patterns)
                .addInterceptors(ticketHandshakeInterceptor);
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(stompSubscribeAuthorizationInterceptor);
    }
}
