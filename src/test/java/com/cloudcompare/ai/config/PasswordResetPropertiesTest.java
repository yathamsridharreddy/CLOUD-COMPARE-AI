package com.cloudcompare.ai.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordResetPropertiesTest {
    private PasswordResetProperties configured() {
        PasswordResetProperties p = new PasswordResetProperties();
        p.setEnabled(true);
        p.setFrontendOrigin("https://cloud-compareai.vercel.app");
        p.setGmailClientId("client");
        p.setGmailClientSecret("secret");
        p.setGmailRefreshToken("refresh");
        p.setSenderEmail("owner@gmail.com");
        return p;
    }

    @Test
    void disabledUntilOwnerConfiguresIt() {
        assertFalse(new PasswordResetProperties().isConfigured());
        PasswordResetProperties p = configured();
        assertTrue(p.isConfigured());
        p.setEnabled(false);
        assertFalse(p.isConfigured());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "http://evil.example", "https://user:pass@example.com", "https://example.com/reset", "https://example.com?redirect=evil", "https://example.com#token"})
    void rejectsUnsafeFrontendOrigins(String origin) {
        PasswordResetProperties p = configured();
        p.setFrontendOrigin(origin);
        assertFalse(p.isConfigured());
    }

    @ParameterizedTest
    @ValueSource(strings = {"sender@gmail.com\r\nBcc: other@example.com", "a@example.com,b@example.com", "Owner <a@gmail.com>", "not-an-email"})
    void rejectsHeaderInjectionAndRecipientLists(String mailbox) {
        assertFalse(PasswordResetProperties.isMailbox(mailbox));
    }

    @Test
    void resetTokenIsAFragmentOnTheConfiguredOrigin() {
        PasswordResetProperties p = configured();
        p.setFrontendOrigin("https://cloud-compareai.vercel.app/");
        assertEquals("https://cloud-compareai.vercel.app/reset-password.html#token=" + "A".repeat(43),
                p.resetLink("A".repeat(43)));
    }
}
