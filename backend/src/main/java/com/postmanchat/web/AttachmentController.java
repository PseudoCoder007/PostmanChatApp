package com.postmanchat.web;

import com.postmanchat.service.AttachmentService;
import com.postmanchat.web.dto.AttachmentDto;
import com.postmanchat.web.dto.RegisterAttachmentRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping
    public AttachmentDto upload(@RequestParam("file") MultipartFile file) {
        return attachmentService.upload(file);
    }

    @PostMapping("/register")
    public AttachmentDto register(@Valid @RequestBody RegisterAttachmentRequest request) {
        return attachmentService.register(request);
    }
}
