package com.postmanchat.web;

import com.postmanchat.service.ProfileService;
import com.postmanchat.web.dto.ProfileDto;
import com.postmanchat.web.dto.UpdateProfileRequest;
import com.postmanchat.web.dto.UpdateStatusRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final ProfileService profileService;

    public MeController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ProfileDto me() {
        return profileService.getOrCreateProfile(Authz.requireJwt());
    }

    @PatchMapping
    public ProfileDto update(@Valid @RequestBody UpdateProfileRequest request) {
        return profileService.updateCurrentProfile(request);
    }

    @PostMapping("/presence")
    public void presence() {
        profileService.touchPresence();
    }

    @PostMapping("/avatar")
    public ProfileDto uploadAvatar(@RequestParam("file") MultipartFile file) {
        return profileService.uploadCurrentAvatar(file);
    }

    @PatchMapping("/status")
    public ProfileDto updateStatus(@Valid @RequestBody UpdateStatusRequest request) {
        return profileService.updateCurrentStatus(request);
    }
}
