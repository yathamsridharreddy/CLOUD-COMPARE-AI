package com.cloudcompare.ai.service.email;

public interface PasswordResetMailer {
    boolean isConfigured();

    void sendResetLink(String recipient, String resetLink);

    void sendPasswordChanged(String recipient);
}
