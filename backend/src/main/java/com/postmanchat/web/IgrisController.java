package com.postmanchat.web;

import com.postmanchat.domain.Profile;
import com.postmanchat.service.IgrisService;
import com.postmanchat.service.ProfileService;
import com.postmanchat.web.dto.IgrisChatRequest;
import com.postmanchat.web.dto.IgrisChatResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/igris")
public class IgrisController {

    private final IgrisService igrisService;
    private final ProfileService profileService;

    public IgrisController(IgrisService igrisService, ProfileService profileService) {
        this.igrisService = igrisService;
        this.profileService = profileService;
    }

    @PostMapping("/chat")
    public IgrisChatResponse chat(@Valid @RequestBody IgrisChatRequest request) {
        Profile profile = profileService.getCurrentProfile();
        return new IgrisChatResponse(igrisService.chat(profile, request.message(), request.history()));
    }
}
