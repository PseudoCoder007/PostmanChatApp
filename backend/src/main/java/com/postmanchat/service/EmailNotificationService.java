package com.postmanchat.service;

import com.postmanchat.domain.Profile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String from;

    public EmailNotificationService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${postman-chat.notifications.email.enabled:false}") boolean enabled,
            @Value("${postman-chat.notifications.email.from:no-reply@postmanchat.local}") String from
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.from = from;
    }

    public void sendNotificationEmail(Profile recipient, String title, String body) {
        if (!enabled || recipient == null || recipient.getEmail() == null || recipient.getEmail().isBlank()) {
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Email notifications are enabled but no JavaMailSender is available.");
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(recipient.getEmail());
            message.setSubject(title);
            message.setText("""
                    Hi %s,

                    %s

                    %s

                    You can open Postman Quest Chat to jump back in.
                    """.formatted(
                    recipient.getDisplayName() == null || recipient.getDisplayName().isBlank() ? "there" : recipient.getDisplayName(),
                    title,
                    body
            ));
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send notification email to {}", recipient.getEmail(), ex);
        }
    }

}
