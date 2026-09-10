package com.cloudcompare.ai.security;

import com.cloudcompare.ai.entity.UserEntity;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordResetJwtTest {
    private static final String SECRET = "a".repeat(64);
    private final JwtUtil jwt = new JwtUtil(SECRET, 3600000L);

    private UserEntity account() {
        return new UserEntity(1L, "Test", "test@example.com", "encoded-password");
    }

    @Test
    void oldJwtIsRevokedEvenWhenResetAndLoginOccurInTheSameSecond() {
        UserEntity account = account();
        String oldToken = jwt.generateToken(new AccountUserDetails(account));
        assertTrue(jwt.validateToken(oldToken, new AccountUserDetails(account)));
        account.setCredentialVersion(1);
        assertFalse(jwt.validateToken(oldToken, new AccountUserDetails(account)));
        String newToken = jwt.generateToken(new AccountUserDetails(account));
        assertTrue(jwt.validateToken(newToken, new AccountUserDetails(account)));
    }

    @Test
    void legacyTokensWorkUntilThatAccountResetsItsPassword() {
        UserEntity account = account();
        String legacy = Jwts.builder().setSubject(account.getEmail())
                .setIssuedAt(new Date()).setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                .compact();
        assertTrue(jwt.validateToken(legacy, new AccountUserDetails(account)));
        account.setCredentialVersion(1);
        assertFalse(jwt.validateToken(legacy, new AccountUserDetails(account)));
    }

    @Test
    void credentialsCannotAuthenticateADifferentAccount() {
        UserEntity first = account();
        String token = jwt.generateToken(new AccountUserDetails(first));
        UserEntity second = new UserEntity(2L, "Other", "other@example.com", "encoded-password");
        assertFalse(jwt.validateToken(token, new AccountUserDetails(second)));
    }
}
