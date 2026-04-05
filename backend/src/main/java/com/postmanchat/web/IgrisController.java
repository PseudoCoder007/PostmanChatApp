package com.postmanchat.web;

import com.postmanchat.service.IgrisService;
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

    public IgrisController(IgrisService igrisService) {
        this.igrisService = igrisService;
    }

    @PostMapping("/chat")
    public IgrisChatResponse chat(@Valid @RequestBody IgrisChatRequest request) {
        return new IgrisChatResponse(igrisService.chat(request.message()));
    }
}
