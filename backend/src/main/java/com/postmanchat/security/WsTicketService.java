package com.postmanchat.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WsTicketService {

    private static final long TTL_MS = 60_000;

    private final Map<String, TicketEntry> tickets = new ConcurrentHashMap<>();

    public String issue(UUID userId) {
        String ticket = UUID.randomUUID().toString();
        tickets.put(ticket, new TicketEntry(userId, System.currentTimeMillis() + TTL_MS));
        return ticket;
    }

    public Optional<UUID> consume(String ticket) {
        if (ticket == null || ticket.isBlank()) {
            return Optional.empty();
        }
        TicketEntry entry = tickets.remove(ticket);
        if (entry == null || System.currentTimeMillis() > entry.expiresAtMs()) {
            return Optional.empty();
        }
        return Optional.of(entry.userId());
    }

    private record TicketEntry(UUID userId, long expiresAtMs) {
    }
}
