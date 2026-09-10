package com.cloudcompare.ai.service;

import com.cloudcompare.ai.entity.PasswordResetToken;
import com.cloudcompare.ai.entity.UserEntity;
import com.cloudcompare.ai.exception.BusinessException;
import com.cloudcompare.ai.repository.PasswordResetTokenRepository;
import com.cloudcompare.ai.repository.UserRepository;
import com.cloudcompare.ai.security.PasswordPolicy;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class PasswordResetTokenService {
    public static final Duration TOKEN_LIFETIME = Duration.ofMinutes(15);
    public static final Duration REQUEST_COOLDOWN = Duration.ofMinutes(10);
    public static final int MAX_REQUESTS_PER_DAY = 100;
    public static final String INVALID_LINK = "The reset link is invalid or has expired. Request a new link.";

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder passwords;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetTokenService(UserRepository users, PasswordResetTokenRepository tokens,
                                     PasswordEncoder passwords,
                                     @Qualifier("passwordResetClock") Clock clock) {
        this.users = users;
        this.tokens = tokens;
        this.passwords = passwords;
        this.clock = clock;
    }

    /** Called by the bounded email worker, never returned by a public endpoint. */
    @Transactional
    public Optional<Delivery> issue(String email) {
        // Preserve the application's existing exact email matching; do not reset an
        // arbitrary account if legacy accounts differ only in address capitalization.
        Optional<UserEntity> account = users.findByEmailForUpdate(email.trim());
        if (account.isEmpty()) return Optional.empty();
        UserEntity user = account.get();
        Instant now = clock.instant();
        if (tokens.existsByUser_IdAndCreatedAtAfter(user.getId(), now.minus(REQUEST_COOLDOWN))
                || tokens.countByCreatedAtAfter(now.minus(Duration.ofDays(1))) >= MAX_REQUESTS_PER_DAY) {
            return Optional.empty();
        }

        byte[] entropy = new byte[32];
        random.nextBytes(entropy);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(entropy);
        PasswordResetToken token = new PasswordResetToken();
        token.setTokenHash(hash(raw));
        token.setUser(user);
        token.setCreatedAt(now);
        token.setExpiresAt(now.plus(TOKEN_LIFETIME));

        // Issuance and consumption always lock the user row first. That serializes
        // simultaneous requests and resets without locking the whole user table.
        tokens.invalidateForUser(user.getId(), now);
        tokens.purgeExpiredBefore(now.minus(Duration.ofDays(1)));
        tokens.save(token);
        return Optional.of(new Delivery(user.getEmail(), raw));
    }

    @Transactional
    public String complete(String rawToken, String newPassword) {
        PasswordPolicy.validate(newPassword);
        if (rawToken == null || !rawToken.matches("[A-Za-z0-9_-]{43}")) throw invalidLink();
        String digest = hash(rawToken);
        Long userId = tokens.findUserIdByHash(digest).orElseThrow(PasswordResetTokenService::invalidLink);
        UserEntity user = users.findByIdForUpdate(userId).orElseThrow(PasswordResetTokenService::invalidLink);
        // Read the token AFTER acquiring the user's lock; a concurrent consumer may
        // have marked it used while we were waiting. Only one reset can commit.
        PasswordResetToken token = tokens.findById(digest).orElseThrow(PasswordResetTokenService::invalidLink);
        Instant now = clock.instant();
        if (token.getUsedAt() != null || !token.getExpiresAt().isAfter(now)
                || !userId.equals(token.getUser().getId())) throw invalidLink();

        user.setPassword(passwords.encode(newPassword));
        user.setCredentialVersion(Math.incrementExact(user.getCredentialVersion()));
        users.save(user);
        tokens.invalidateForUser(userId, now);
        return user.getEmail();
    }

    private static BusinessException invalidLink() {
        return new BusinessException(INVALID_LINK);
    }

    public static String hash(String rawToken) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable");
        }
    }

    public record Delivery(String recipient, String token) {
        @Override
        public String toString() {
            return "PasswordResetDelivery[redacted]";
        }
    }
}
