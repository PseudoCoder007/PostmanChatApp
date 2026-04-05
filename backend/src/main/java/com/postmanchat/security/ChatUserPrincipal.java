package com.postmanchat.security;

import java.security.Principal;
import java.util.UUID;

public record ChatUserPrincipal(UUID userId) implements Principal {

    @Override
    public String getName() {
        return userId.toString();
    }
}
