package com.postmanchat.web;

import com.postmanchat.service.ProfileService;
import com.postmanchat.web.dto.LoginIdentifierResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/auth")
public class PublicAuthController {

    private final ProfileService profileService;

    public PublicAuthController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/login-identifier")
    public LoginIdentifierResponse resolveLoginIdentifier(@RequestParam String value) {
        return profileService.resolveLoginIdentifier(value);
    }
}
