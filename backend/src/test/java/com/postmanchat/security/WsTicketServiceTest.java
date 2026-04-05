package com.postmanchat.security;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WsTicketServiceTest {

    @Test
    void ticketIsSingleUse() {
        WsTicketService service = new WsTicketService();
        UUID user = UUID.randomUUID();
        String ticket = service.issue(user);
        assertEquals(user, service.consume(ticket).orElseThrow());
        assertTrue(service.consume(ticket).isEmpty());
    }

    @Test
    void invalidTicketEmpty() {
        WsTicketService service = new WsTicketService();
        assertTrue(service.consume("nope").isEmpty());
    }
}
