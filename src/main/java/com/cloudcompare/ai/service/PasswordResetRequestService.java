package com.cloudcompare.ai.service;

import com.cloudcompare.ai.config.PasswordResetProperties;
import com.cloudcompare.ai.exception.BusinessException;
import com.cloudcompare.ai.service.email.PasswordResetMailer;
import com.cloudcompare.ai.service.email.MailDeliveryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.util.concurrent.RejectedExecutionException;

@Service
public class PasswordResetRequestService {
    public static final String ACCEPTED_MESSAGE = "If an eligible account exists for that email, a password reset link will be sent. "
            + "Check your inbox and spam folder. Please wait 10 minutes before requesting another link.";
    private static final Logger log = LoggerFactory.getLogger(PasswordResetRequestService.class);
    private final PasswordResetTokenService tokens;
    private final PasswordResetMailer mailer;
    private final PasswordResetProperties properties;
    private final ThreadPoolTaskExecutor executor;

    public PasswordResetRequestService(PasswordResetTokenService tokens, PasswordResetMailer mailer,
                                      PasswordResetProperties properties,
                                      @Qualifier("passwordResetExecutor") ThreadPoolTaskExecutor executor) {
        this.tokens = tokens;
        this.mailer = mailer;
        this.properties = properties;
        this.executor = executor;
    }

    public void request(String email) {
        // Configuration/queue failures are identical for every address. Account
        // lookup and network I/O stay off the HTTP thread; the response does not wait for them.
        if (!properties.isConfigured() || !mailer.isConfigured()) throw unavailable();
        try {
            executor.execute(() -> {
                try {
                    tokens.issue(email.trim()).ifPresent(delivery ->
                            mailer.sendResetLink(delivery.recipient(), properties.resetLink(delivery.token())));
                } catch (RuntimeException ex) {
                    // A mail timeout may mean Gmail accepted the message. Do not
                    // retry blindly or revoke a possibly delivered link. It expires.
                    log.warn("Password-reset delivery could not complete ({}). Check Gmail authorization and quotas.",
                            safeFailure(ex));
                }
            });
        } catch (RejectedExecutionException ex) {
            throw unavailable();
        }
    }

    public void notifyPasswordChanged(String email) {
        if (!properties.isConfigured() || !mailer.isConfigured()) return;
        try {
            executor.execute(() -> {
                try {
                    mailer.sendPasswordChanged(email);
                } catch (RuntimeException ex) {
                    log.warn("Password-change notification could not be delivered ({}).",
                            safeFailure(ex));
                }
            });
        } catch (RejectedExecutionException ex) {
            // The password change has already committed. Never roll it back for mail.
            log.warn("Password-change notification queue is full.");
        }
    }

    private static String safeFailure(RuntimeException ex) {
        return ex instanceof MailDeliveryException ? ex.getMessage() : ex.getClass().getSimpleName();
    }

    private static BusinessException unavailable() {
        return new BusinessException("Password reset email is currently unavailable. Please try again later.",
                HttpStatus.SERVICE_UNAVAILABLE);
    }
}
