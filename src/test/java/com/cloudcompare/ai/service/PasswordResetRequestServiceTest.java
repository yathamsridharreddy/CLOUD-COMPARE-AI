package com.cloudcompare.ai.service;

import com.cloudcompare.ai.config.PasswordResetProperties;
import com.cloudcompare.ai.exception.BusinessException;
import com.cloudcompare.ai.service.email.PasswordResetMailer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.Optional;
import java.util.concurrent.RejectedExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PasswordResetRequestServiceTest {
    private PasswordResetTokenService tokens;
    private PasswordResetMailer mailer;
    private ThreadPoolTaskExecutor executor;
    private PasswordResetProperties properties;
    private PasswordResetRequestService service;

    @BeforeEach
    void setup() {
        tokens = mock(PasswordResetTokenService.class);
        mailer = mock(PasswordResetMailer.class);
        executor = mock(ThreadPoolTaskExecutor.class);
        properties = new PasswordResetProperties();
        properties.setEnabled(true);
        properties.setFrontendOrigin("https://cloud-compareai.vercel.app");
        properties.setGmailClientId("client");
        properties.setGmailClientSecret("secret");
        properties.setGmailRefreshToken("refresh");
        properties.setSenderEmail("owner@gmail.com");
        when(mailer.isConfigured()).thenReturn(true);
        service = new PasswordResetRequestService(tokens, mailer, properties, executor);
    }

    @Test
    void endpointDoesNotWaitForAccountLookupOrEmailSending() {
        service.request("person@example.com");
        ArgumentCaptor<Runnable> work = ArgumentCaptor.forClass(Runnable.class);
        verify(executor).execute(work.capture());
        verifyNoInteractions(tokens);
        verify(mailer, never()).sendResetLink(any(), any());
        when(tokens.issue("person@example.com")).thenReturn(Optional.of(
                new PasswordResetTokenService.Delivery("person@example.com", "A".repeat(43))));
        work.getValue().run();
        verify(mailer).sendResetLink("person@example.com",
                "https://cloud-compareai.vercel.app/reset-password.html#token=" + "A".repeat(43));
    }

    @Test
    void unknownAccountIsQueuedInTheSameWayButNeverEmailed() {
        service.request("unknown@example.com");
        ArgumentCaptor<Runnable> work = ArgumentCaptor.forClass(Runnable.class);
        verify(executor).execute(work.capture());
        when(tokens.issue("unknown@example.com")).thenReturn(Optional.empty());
        work.getValue().run();
        verify(mailer, never()).sendResetLink(any(), any());
    }

    @Test
    void unconfiguredTransportAndFullQueueFailWithoutAccountLookup() {
        properties.setEnabled(false);
        BusinessException disabled = assertThrows(BusinessException.class, () -> service.request("person@example.com"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, disabled.getStatus());
        verifyNoInteractions(tokens, executor);
        properties.setEnabled(true);
        doThrow(new RejectedExecutionException()).when(executor).execute(any(Runnable.class));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                assertThrows(BusinessException.class, () -> service.request("unknown@example.com")).getStatus());
        verifyNoInteractions(tokens);
    }

    @Test
    void notificationFailureCannotUndoAPasswordChange() {
        doThrow(new RejectedExecutionException()).when(executor).execute(any(Runnable.class));
        assertDoesNotThrow(() -> service.notifyPasswordChanged("person@example.com"));
    }
}
