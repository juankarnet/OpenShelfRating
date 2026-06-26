package com.openshelfrating.backend.auth.service;

import com.openshelfrating.backend.auth.config.MailProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class VerificationEmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(VerificationEmailService.class);

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public VerificationEmailService(JavaMailSender mailSender, MailProperties mailProperties) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
    }

    public void sendVerificationEmail(String toEmail, String verificationUrl) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailProperties.getFrom());
            message.setTo(toEmail);
            message.setSubject("OpenShelfRating - Verify your email");
            message.setText("Welcome to OpenShelfRating. Verify your email with this link: " + verificationUrl);
            mailSender.send(message);
        } catch (Exception ex) {
            LOGGER.error("Failed to send verification email to {}", toEmail, ex);
            throw new AuthException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Email service is temporarily unavailable");
        }
    }
}
