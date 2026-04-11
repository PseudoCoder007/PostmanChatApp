package com.postmanchat.web;

import com.postmanchat.service.ProfileService;
import com.postmanchat.web.dto.UsernameAvailabilityDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/usernames")
public class PublicProfileController {

    private final ProfileService profileService;

    public PublicProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/availability")
    public UsernameAvailabilityDto checkAvailability(@RequestParam String username) {
        return profileService.checkUsernameAvailability(username);
    }
}
