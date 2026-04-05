package com.postmanchat.web;

import com.postmanchat.security.WsTicketService;
import com.postmanchat.web.dto.WsTicketResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final WsTicketService wsTicketService;

    public AuthController(WsTicketService wsTicketService) {
        this.wsTicketService = wsTicketService;
    }

    @PostMapping("/ws-ticket")
    public WsTicketResponse wsTicket() {
        return new WsTicketResponse(wsTicketService.issue(Authz.requireUserId()));
    }
}
