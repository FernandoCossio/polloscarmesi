package com.auth.services.email;

public interface EmailService {
    void sendEmail(String to, String subject, String body);
}
