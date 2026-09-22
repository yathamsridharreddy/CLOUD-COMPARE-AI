package com.cloudcompare.ai.service.email;

import com.cloudcompare.ai.config.PasswordResetProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class GmailPasswordResetMailerTest {
    private final ObjectMapper json = new ObjectMapper();
    private HttpServer server;
    private GmailPasswordResetMailer mailer;
    private PasswordResetProperties properties;
    private final AtomicInteger tokenCalls = new AtomicInteger();
    private final AtomicInteger sendCalls = new AtomicInteger();
    private final AtomicInteger firstSendStatus = new AtomicInteger(200);
    private final AtomicInteger tokenStatus = new AtomicInteger(200);
    private final AtomicReference<String> tokenForm = new AtomicReference<>();
    private final AtomicReference<String> message = new AtomicReference<>();
    private final AtomicReference<String> authorization = new AtomicReference<>();

    @BeforeEach
    void setup() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/token", exchange -> {
            tokenCalls.incrementAndGet();
            tokenForm.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            respond(exchange, tokenStatus.get(), tokenStatus.get() == 200
                    ? "{\"access_token\":\"local-access-token\",\"expires_in\":3600}"
                    : "{\"error\":\"secret-provider-payload\"}");
        });
        server.createContext("/send", exchange -> {
            int call = sendCalls.incrementAndGet();
            message.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            respond(exchange, call == 1 ? firstSendStatus.get() : 200, "{\"id\":\"local-only\"}");
        });
        server.start();
        properties = new PasswordResetProperties();
        properties.setEnabled(true);
        properties.setFrontendOrigin("https://cloud-compareai.vercel.app");
        properties.setSenderEmail("owner@gmail.com");
        properties.setGmailClientId("client");
        properties.setGmailClientSecret("private+secret");
        properties.setGmailRefreshToken("private&refresh");
        String origin = "http://127.0.0.1:" + server.getAddress().getPort();
        mailer = new GmailPasswordResetMailer(properties, json,
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build(),
                URI.create(origin + "/token"), URI.create(origin + "/send"), Clock.systemUTC());
    }

    private static void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (var output = exchange.getResponseBody()) { output.write(bytes); }
    }

    @AfterEach
    void cleanup() {
        if (mailer != null) mailer.close();
        if (server != null) server.stop(0);
    }

    @Test
    void usesRefreshGrantAndSendsOnlyToRequestedMailbox() throws Exception {
        String link = "https://cloud-compareai.vercel.app/reset-password.html#token=" + "A".repeat(43);
        mailer.sendResetLink("registered@example.com", link);
        assertTrue(tokenForm.get().contains("grant_type=refresh_token"));
        assertTrue(tokenForm.get().contains("client_secret=private%2Bsecret"));
        assertTrue(tokenForm.get().contains("refresh_token=private%26refresh"));
        assertEquals("Bearer local-access-token", authorization.get());
        String raw = json.readTree(message.get()).get("raw").asText();
        String mime = new String(Base64.getUrlDecoder().decode(raw), StandardCharsets.UTF_8);
        assertTrue(mime.contains("To: <registered@example.com>\r\n"));
        assertTrue(mime.contains("From: CloudCompare AI <owner@gmail.com>\r\n"));
        String body = new String(Base64.getMimeDecoder().decode(mime.split("\r\n\r\n", 2)[1]), StandardCharsets.UTF_8);
        assertTrue(body.contains(link));
        assertTrue(body.contains("15 minutes"));
        assertFalse(mime.contains(properties.getGmailClientSecret()));
        mailer.sendPasswordChanged("registered@example.com");
        assertEquals(1, tokenCalls.get(), "reuse a still-valid access token");
        assertEquals(2, sendCalls.get());
    }

    @Test
    void refreshesOnceOnRejectedAccessToken() {
        firstSendStatus.set(401);
        mailer.sendPasswordChanged("registered@example.com");
        assertEquals(2, tokenCalls.get());
        assertEquals(2, sendCalls.get());
    }

    @Test
    void doesNotRetryOrExposePayloadWhenGoogleRejectsTheRequest() {
        firstSendStatus.set(429);
        MailDeliveryException error = assertThrows(MailDeliveryException.class,
                () -> mailer.sendPasswordChanged("registered@example.com"));
        assertTrue(error.getMessage().contains("429"));
        assertEquals(1, sendCalls.get());
        tokenStatus.set(400);
        // A new mailer has no access-token cache.
        mailer.close();
        String origin = "http://127.0.0.1:" + server.getAddress().getPort();
        mailer = new GmailPasswordResetMailer(properties, json, HttpClient.newHttpClient(),
                URI.create(origin + "/token"), URI.create(origin + "/send"), Clock.systemUTC());
        MailDeliveryException authError = assertThrows(MailDeliveryException.class,
                () -> mailer.sendPasswordChanged("registered@example.com"));
        assertFalse(authError.getMessage().contains("secret-provider-payload"));
        assertFalse(authError.getMessage().contains("private&refresh"));
    }

    @Test
    void disabledMailAndHeaderInjectionNeverUseTheNetwork() {
        properties.setEnabled(false);
        assertThrows(MailDeliveryException.class, () -> mailer.sendPasswordChanged("registered@example.com"));
        properties.setEnabled(true);
        assertThrows(MailDeliveryException.class,
                () -> mailer.sendPasswordChanged("registered@example.com\r\nBcc: other@example.com"));
        assertEquals(0, tokenCalls.get());
        assertEquals(0, sendCalls.get());
    }
}
