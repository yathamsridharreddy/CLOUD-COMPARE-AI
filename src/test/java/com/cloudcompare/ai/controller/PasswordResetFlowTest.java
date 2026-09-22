package com.cloudcompare.ai.controller;

import com.cloudcompare.ai.config.PasswordResetProperties;
import com.cloudcompare.ai.dto.ChatResponse;
import com.cloudcompare.ai.entity.PasswordResetToken;
import com.cloudcompare.ai.repository.PasswordResetTokenRepository;
import com.cloudcompare.ai.repository.UserRepository;
import com.cloudcompare.ai.service.PasswordResetRequestService;
import com.cloudcompare.ai.service.PasswordResetTokenService;
import com.cloudcompare.ai.service.chat.CloudCompareChatbotService;
import com.cloudcompare.ai.service.email.PasswordResetMailer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "password-reset.enabled=true",
        "password-reset.frontend-origin=https://cloud-compareai.vercel.app",
        "password-reset.sender-email=owner@gmail.com",
        "password-reset.gmail-client-id=local-test",
        "password-reset.gmail-client-secret=local-test",
        "password-reset.gmail-refresh-token=local-test",
        "cors.allowed-origins=https://cloud-compareai.vercel.app",
        "grok.api.keys=",
        "logging.level.org.springframework.web=INFO"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PasswordResetFlowTest {
    private static final String ORIGIN = "https://cloud-compareai.vercel.app";
    private static final AtomicInteger NEXT_IP = new AtomicInteger();
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UserRepository users;
    @Autowired private PasswordResetTokenRepository tokens;
    @Autowired private PasswordResetProperties properties;
    @Autowired private PasswordResetTokenService tokenService;
    @MockBean private PasswordResetMailer mailer;
    @MockBean(name = "passwordResetExecutor") private ThreadPoolTaskExecutor executor;
    @MockBean private CloudCompareChatbotService chat;
    private String email;
    private String ip;

    @BeforeEach
    void setup() {
        properties.setEnabled(true);
        email = "reset-" + UUID.randomUUID() + "@example.com";
        ip = "198.51.100." + NEXT_IP.incrementAndGet();
        when(mailer.isConfigured()).thenReturn(true);
        doAnswer(invocation -> { ((Runnable) invocation.getArgument(0)).run(); return null; })
                .when(executor).execute(any(Runnable.class));
    }

    private void signup() throws Exception {
        mvc.perform(post("/api/auth/signup").header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Reset Test", "email", email, "password", "OldPassword1@"))))
                .andExpect(status().isOk());
    }

    private String login(String password, boolean valid) throws Exception {
        String body = mvc.perform(post("/api/auth/login").header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(valid ? status().isOk() : status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).path("token").asText();
    }

    private String requestLink() throws Exception {
        mvc.perform(post("/api/auth/forgot-password").header("X-Forwarded-For", ip)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer stale-login-token")
                        .header(HttpHeaders.HOST, "attacker.example")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value(PasswordResetRequestService.ACCEPTED_MESSAGE))
                .andExpect(jsonPath("$.token").doesNotExist());
        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(mailer).sendResetLink(eq(email), link.capture());
        URI uri = URI.create(link.getValue());
        assertEquals("cloud-compareai.vercel.app", uri.getHost());
        assertNull(uri.getQuery());
        return uri.getFragment().substring("token=".length());
    }

    @Test
    void completeEmailResetPreservesLoginButRevokesOldJwtAndLink() throws Exception {
        signup();
        String oldJwt = login("OldPassword1@", true);
        String raw = requestLink();
        assertTrue(raw.matches("[A-Za-z0-9_-]{43}"));
        assertTrue(tokens.findById(raw).isEmpty());
        assertTrue(tokens.findById(PasswordResetTokenService.hash(raw)).isPresent());

        mvc.perform(post("/api/auth/reset-password").header("X-Forwarded-For", ip)
                        .header(HttpHeaders.ORIGIN, ORIGIN)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer stale-login-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("token", raw, "newPassword", "NewPassword2@"))))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ORIGIN))
                .andExpect(jsonPath("$.token").doesNotExist());
        login("OldPassword1@", false);
        String newJwt = login("NewPassword2@", true);
        assertEquals(1, users.findByEmail(email).orElseThrow().getCredentialVersion());
        assertNotEquals("NewPassword2@", users.findByEmail(email).orElseThrow().getPassword());
        verify(mailer).sendPasswordChanged(email);

        mvc.perform(post("/api/chat/cloud").header("X-Forwarded-For", ip)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + oldJwt)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"question\":\"Explain\"}"))
                .andExpect(status().isForbidden());
        when(chat.chat(any())).thenReturn(ChatResponse.builder().reply("Authenticated").build());
        mvc.perform(post("/api/chat/cloud").header("X-Forwarded-For", ip)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + newJwt)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"question\":\"Explain\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/reset-password").header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("token", raw, "newPassword", "OtherPassword3@"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(PasswordResetTokenService.INVALID_LINK));
        login("NewPassword2@", true);
    }

    @Test
    void nonexistentEmailAndCooldownUseTheSameGenericResponse() throws Exception {
        mvc.perform(post("/api/auth/forgot-password").header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value(PasswordResetRequestService.ACCEPTED_MESSAGE));
        verify(mailer, never()).sendResetLink(any(), any());
        signup();
        requestLink();
        mvc.perform(post("/api/auth/forgot-password").header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value(PasswordResetRequestService.ACCEPTED_MESSAGE));
        verify(mailer, times(1)).sendResetLink(eq(email), any());
    }

    @Test
    void simultaneousConsumersCanOnlyResetOnce() throws Exception {
        signup();
        String raw = requestLink();
        java.util.concurrent.CountDownLatch start = new java.util.concurrent.CountDownLatch(1);
        try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<Boolean> consume = () -> {
                start.await();
                try {
                    tokenService.complete(raw, "ConcurrentPassword3@");
                    return true;
                } catch (com.cloudcompare.ai.exception.BusinessException expected) {
                    return false;
                }
            };
            var first = pool.submit(consume);
            var second = pool.submit(consume);
            start.countDown();
            int successes = (first.get(10, java.util.concurrent.TimeUnit.SECONDS) ? 1 : 0)
                    + (second.get(10, java.util.concurrent.TimeUnit.SECONDS) ? 1 : 0);
            assertEquals(1, successes);
        }
        assertEquals(1, users.findByEmail(email).orElseThrow().getCredentialVersion());
        login("ConcurrentPassword3@", true);
    }

    @Test
    void expiredLinkCannotChangePassword() throws Exception {
        signup();
        String raw = requestLink();
        PasswordResetToken token = tokens.findById(PasswordResetTokenService.hash(raw)).orElseThrow();
        token.setExpiresAt(Instant.now().minusSeconds(1));
        tokens.saveAndFlush(token);
        mvc.perform(post("/api/auth/reset-password").header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("token", raw, "newPassword", "NewPassword2@"))))
                .andExpect(status().isBadRequest());
        login("OldPassword1@", true);
    }

    @Test
    void untrustedOriginsAndWeakPasswordsCannotConsumeTheLink() throws Exception {
        signup();
        String raw = requestLink();
        mvc.perform(post("/api/auth/reset-password").header("X-Forwarded-For", ip)
                        .header(HttpHeaders.ORIGIN, "https://untrusted.example")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("token", raw, "newPassword", "NewPassword2@"))))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/reset-password").header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("token", raw, "newPassword", "weak"))))
                .andExpect(status().isBadRequest());
        assertNull(tokens.findById(PasswordResetTokenService.hash(raw)).orElseThrow().getUsedAt());
        login("OldPassword1@", true);
    }

    @Test
    void resetPageIsPublicAndHealthNeverDependsOnEmailConfiguration() throws Exception {
        properties.setEnabled(false);
        mvc.perform(get("/reset-password.html"))
                .andExpect(status().isOk())
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
        mvc.perform(post("/api/auth/forgot-password").header("X-Forwarded-For", ip)
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isServiceUnavailable());
        mvc.perform(get("/health").header(HttpHeaders.AUTHORIZATION, "Bearer ignored"))
                .andExpect(status().isOk()).andExpect(content().string("OK"));
        verify(mailer, never()).sendResetLink(any(), any());
    }
}
