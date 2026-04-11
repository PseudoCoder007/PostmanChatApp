package com.postmanchat.service;

import com.postmanchat.domain.Profile;
import com.postmanchat.web.dto.FeedbackRequest;
import com.postmanchat.web.dto.FeedbackResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class FeedbackService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String from;

    public FeedbackService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${postman-chat.notifications.email.enabled:false}") String enabledValue,
            @Value("${postman-chat.notifications.email.from:no-reply@postmanchat.local}") String from
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabledValue != null && !enabledValue.isBlank() && Boolean.parseBoolean(enabledValue);
        this.from = from;
    }

    public FeedbackResponse submit(Profile profile, FeedbackRequest request) {
        if (!enabled) {
            throw new IllegalArgumentException("Feedback email is not configured right now.");
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalArgumentException("Feedback email is not configured right now.");
        }
        if (from == null || from.isBlank()) {
            throw new IllegalArgumentException("Feedback recipient is not configured right now.");
        }

        String contactEmail = firstNonBlank(request.contactEmail(), profile.getEmail(), "not-provided@postmanchat.local");
        String category = firstNonBlank(request.category(), "feedback").toLowerCase();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(from);
        message.setReplyTo(contactEmail);
        message.setSubject("[PostmanChat %s] %s".formatted(category.toUpperCase(), request.subject().trim()));
        message.setText("""
                New PostmanChat submission

                Category: %s
                From profile: %s (@%s)
                Account email: %s
                Contact email: %s

                Message:
                %s
                """.formatted(
                category,
                firstNonBlank(profile.getDisplayName(), "Unknown user"),
                firstNonBlank(profile.getUsername(), "unknown"),
                firstNonBlank(profile.getEmail(), "unknown"),
                contactEmail,
                request.message().trim()
        ));
        mailSender.send(message);
        return new FeedbackResponse(true, "Your message has been sent. Thanks for the feedback.");
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
