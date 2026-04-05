package com.postmanchat.web;

import com.postmanchat.service.ProfileService;
import com.postmanchat.web.dto.ProfileDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public List<ProfileDto> searchProfiles(
            @RequestParam String query,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        return profileService.searchProfiles(query, limit);
    }
}
