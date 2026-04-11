package com.postmanchat.web;

import com.postmanchat.domain.Profile;
import com.postmanchat.service.FeedbackService;
import com.postmanchat.service.ProfileService;
import com.postmanchat.web.dto.FeedbackRequest;
import com.postmanchat.web.dto.FeedbackResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final ProfileService profileService;

    public FeedbackController(FeedbackService feedbackService, ProfileService profileService) {
        this.feedbackService = feedbackService;
        this.profileService = profileService;
    }

    @PostMapping
    public FeedbackResponse submit(@Valid @RequestBody FeedbackRequest request) {
        Profile profile = profileService.getCurrentProfile();
        return feedbackService.submit(profile, request);
    }
}
