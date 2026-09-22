package com.cloudcompare.ai.service.email;

import com.cloudcompare.ai.config.PasswordResetProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Map;

/** Gmail HTTPS API with a send-only, owner-authorized OAuth grant; no SMTP ports. */
@Service
public class GmailPasswordResetMailer implements PasswordResetMailer {
    private static final URI TOKEN_ENDPOINT = URI.create("https://oauth2.googleapis.com/token");
    private static final URI SEND_ENDPOINT = URI.create("https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
    private final PasswordResetProperties properties;
    private final ObjectMapper json;
    private final HttpClient http;
    private final URI tokenEndpoint;
    private final URI sendEndpoint;
    private final Clock clock;
    private String accessToken;
    private Instant accessTokenExpires = Instant.EPOCH;

    @Autowired
    public GmailPasswordResetMailer(PasswordResetProperties properties, ObjectMapper json) {
        this(properties, json, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER).build(), TOKEN_ENDPOINT, SEND_ENDPOINT, Clock.systemUTC());
    }

    // Package-private transport injection is for local HTTP tests, not configuration.
    GmailPasswordResetMailer(PasswordResetProperties properties, ObjectMapper json, HttpClient http,
                             URI tokenEndpoint, URI sendEndpoint, Clock clock) {
        this.properties = properties;
        this.json = json;
        this.http = http;
        this.tokenEndpoint = tokenEndpoint;
        this.sendEndpoint = sendEndpoint;
        this.clock = clock;
    }

    @Override
    public boolean isConfigured() {
        return properties.isConfigured();
    }

    @Override
    public void sendResetLink(String recipient, String resetLink) {
        send(recipient, "Reset your CloudCompare AI password",
                "A password reset was requested for your CloudCompare AI account.\n\n"
                        + "Choose a new password using this one-time link (valid for 15 minutes):\n"
                        + resetLink + "\n\n"
                        + "If you did not request this, ignore this email. Your password has not changed.\n"
                        + "Never share this link. CloudCompare AI will never email you your password.\n");
    }

    @Override
    public void sendPasswordChanged(String recipient) {
        send(recipient, "Your CloudCompare AI password was changed",
                "Your CloudCompare AI password has been changed.\n\n"
                        + "Existing login tokens and reset links have been invalidated. Sign in again with your new password.\n"
                        + "If you did not make this change, secure your email account and request a new reset immediately.\n");
    }

    private void send(String recipient, String subject, String text) {
        if (!isConfigured() || !PasswordResetProperties.isMailbox(recipient)) {
            throw new MailDeliveryException("Password reset mail is not configured or the address is invalid");
        }
        String mime = "From: CloudCompare AI <" + properties.getSenderEmail() + ">\r\n"
                + "To: <" + recipient + ">\r\n"
                + "Subject: " + subject + "\r\n"
                + "Date: " + DateTimeFormatter.RFC_1123_DATE_TIME.format(ZonedDateTime.now(clock)) + "\r\n"
                + "MIME-Version: 1.0\r\n"
                + "Content-Type: text/plain; charset=UTF-8\r\n"
                + "Content-Transfer-Encoding: base64\r\n\r\n"
                + Base64.getMimeEncoder(76, new byte[]{'\r', '\n'})
                        .encodeToString(text.getBytes(StandardCharsets.UTF_8)) + "\r\n";
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(mime.getBytes(StandardCharsets.UTF_8));
        try {
            String payload = json.writeValueAsString(Map.of("raw", raw));
            HttpResponse<String> response = sendMessage(payload, getAccessToken());
            if (response.statusCode() == 401) {
                // A rejected authentication attempt cannot have sent the message.
                // Retry it once with a refreshed token, not on timeouts or 429s.
                invalidateAccessToken();
                response = sendMessage(payload, getAccessToken());
            }
            if (response.statusCode() != 200) {
                throw new MailDeliveryException("Gmail rejected the message (HTTP " + response.statusCode() + ")");
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new MailDeliveryException("Gmail request was interrupted");
        } catch (IOException ex) {
            throw new MailDeliveryException("Gmail could not be reached or returned invalid data");
        }
    }

    private HttpResponse<String> sendMessage(String body, String bearer) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(sendEndpoint).timeout(Duration.ofSeconds(10))
                .header("Authorization", "Bearer " + bearer)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body)).build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private synchronized String getAccessToken() throws IOException, InterruptedException {
        if (accessToken != null && accessTokenExpires.isAfter(clock.instant().plusSeconds(60))) return accessToken;
        String form = "grant_type=refresh_token&client_id=" + encode(properties.getGmailClientId())
                + "&client_secret=" + encode(properties.getGmailClientSecret())
                + "&refresh_token=" + encode(properties.getGmailRefreshToken());
        HttpRequest request = HttpRequest.newBuilder(tokenEndpoint).timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form)).build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new MailDeliveryException("Gmail authorization failed (HTTP " + response.statusCode() + ")");
        }
        JsonNode data;
        try {
            data = json.readTree(response.body());
        } catch (IOException ex) {
            // Never include an OAuth response body in an exception/log.
            throw new MailDeliveryException("Gmail authorization returned invalid data");
        }
        String token = data == null ? "" : data.path("access_token").asText("");
        if (token.isBlank() || token.indexOf('\r') >= 0 || token.indexOf('\n') >= 0) {
            throw new MailDeliveryException("Gmail authorization returned no usable access token");
        }
        long lifetime = Math.max(1, Math.min(3600, data.path("expires_in").asLong(3600)));
        accessToken = token;
        accessTokenExpires = clock.instant().plusSeconds(lifetime);
        return accessToken;
    }

    private synchronized void invalidateAccessToken() {
        accessToken = null;
        accessTokenExpires = Instant.EPOCH;
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    @PreDestroy
    public void close() {
        http.close();
    }
}
