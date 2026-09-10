package com.cloudcompare.ai.service;

import com.cloudcompare.ai.entity.PasswordResetToken;
import com.cloudcompare.ai.entity.UserEntity;
import com.cloudcompare.ai.exception.BusinessException;
import com.cloudcompare.ai.repository.PasswordResetTokenRepository;
import com.cloudcompare.ai.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PasswordResetTokenServiceTest {
    private final Instant now = Instant.parse("2026-09-09T00:00:00Z");
    private UserRepository users;
    private PasswordResetTokenRepository tokens;
    private PasswordEncoder passwords;
    private PasswordResetTokenService service;
    private UserEntity user;

    @BeforeEach
    void setup() {
        users = mock(UserRepository.class);
        tokens = mock(PasswordResetTokenRepository.class);
        passwords = mock(PasswordEncoder.class);
        service = new PasswordResetTokenService(users, tokens, passwords, Clock.fixed(now, ZoneOffset.UTC));
        user = new UserEntity(1L, "Test", "person@example.com", "old-encoded");
    }

    @Test
    void unknownAccountDoesNotCreateAToken() {
        when(users.findByEmailForUpdate("unknown@example.com")).thenReturn(Optional.empty());
        assertTrue(service.issue("unknown@example.com").isEmpty());
        verifyNoInteractions(tokens, passwords);
    }

    @Test
    void storesOnlyDigestAndExpiresAfterFifteenMinutes() {
        when(users.findByEmailForUpdate(user.getEmail())).thenReturn(Optional.of(user));
        PasswordResetTokenService.Delivery delivery = service.issue(user.getEmail()).orElseThrow();
        ArgumentCaptor<PasswordResetToken> saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokens).save(saved.capture());
        assertTrue(delivery.token().matches("[A-Za-z0-9_-]{43}"));
        assertEquals(user.getEmail(), delivery.recipient());
        assertEquals(PasswordResetTokenService.hash(delivery.token()), saved.getValue().getTokenHash());
        assertNotEquals(delivery.token(), saved.getValue().getTokenHash());
        assertEquals(now.plus(Duration.ofMinutes(15)), saved.getValue().getExpiresAt());
        assertFalse(delivery.toString().contains(delivery.token()));
        verify(tokens).invalidateForUser(user.getId(), now);
    }

    @Test
    void accountCooldownAndGlobalSendBudgetSuppressIssuance() {
        when(users.findByEmailForUpdate(user.getEmail())).thenReturn(Optional.of(user));
        when(tokens.existsByUser_IdAndCreatedAtAfter(eq(user.getId()), any())).thenReturn(true);
        assertTrue(service.issue(user.getEmail()).isEmpty());
        verify(tokens, never()).save(any());
        when(tokens.existsByUser_IdAndCreatedAtAfter(eq(user.getId()), any())).thenReturn(false);
        when(tokens.countByCreatedAtAfter(any())).thenReturn(100L);
        assertTrue(service.issue(user.getEmail()).isEmpty());
        verify(tokens, never()).save(any());
    }

    private PasswordResetToken eligible(String raw) {
        String digest = PasswordResetTokenService.hash(raw);
        PasswordResetToken token = new PasswordResetToken();
        token.setTokenHash(digest);
        token.setUser(user);
        token.setCreatedAt(now.minusSeconds(30));
        token.setExpiresAt(now.plusSeconds(60));
        when(tokens.findUserIdByHash(digest)).thenReturn(Optional.of(user.getId()));
        when(users.findByIdForUpdate(user.getId())).thenReturn(Optional.of(user));
        when(tokens.findById(digest)).thenReturn(Optional.of(token));
        return token;
    }

    @Test
    void successfulResetHashesPasswordAndRevokesAllOlderCredentials() {
        String raw = "A".repeat(43);
        eligible(raw);
        when(passwords.encode("NewPassword1@")).thenReturn("new-encoded");
        assertEquals(user.getEmail(), service.complete(raw, "NewPassword1@"));
        assertEquals("new-encoded", user.getPassword());
        assertEquals(1, user.getCredentialVersion());
        verify(users).save(user);
        verify(tokens).invalidateForUser(user.getId(), now);
    }

    @Test
    void expiredAndUsedTokensNeverChangePassword() {
        String raw = "A".repeat(43);
        PasswordResetToken token = eligible(raw);
        token.setExpiresAt(now);
        assertEquals(PasswordResetTokenService.INVALID_LINK,
                assertThrows(BusinessException.class, () -> service.complete(raw, "NewPassword1@")).getMessage());
        token.setExpiresAt(now.plusSeconds(60));
        token.setUsedAt(now.minusSeconds(1));
        assertThrows(BusinessException.class, () -> service.complete(raw, "NewPassword1@"));
        verifyNoInteractions(passwords);
        verify(users, never()).save(any());
    }

    @Test
    void invalidInputAndWeakPasswordsNeverReachPasswordEncoding() {
        assertThrows(BusinessException.class, () -> service.complete("invalid", "NewPassword1@"));
        assertThrows(BusinessException.class, () -> service.complete("A".repeat(43), "weak"));
        verifyNoInteractions(passwords, users, tokens);
    }
}
