package com.postmanchat.web;

import com.postmanchat.domain.Profile;
import com.postmanchat.service.IgrisService;
import com.postmanchat.service.ProfileService;
import com.postmanchat.web.dto.IgrisChatRequest;
import com.postmanchat.web.dto.IgrisChatResponse;
import com.postmanchat.web.dto.IgrisHistoryItemDto;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    @GetMapping("/history")
    public List<IgrisHistoryItemDto> history(@RequestParam(defaultValue = "24") int limit) {
        Profile profile = profileService.getCurrentProfile();
        return igrisService.listHistory(profile, limit);
    }
}
