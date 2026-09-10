package com.cloudcompare.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.regex.Pattern;

/** No toString: this bean contains server-only OAuth credentials. */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "password-reset")
public class PasswordResetProperties {
    private boolean enabled;
    private String frontendOrigin = "";
    private String gmailClientId = "";
    private String gmailClientSecret = "";
    private String gmailRefreshToken = "";
    private String senderEmail = "";

    private static final Pattern MAILBOX = Pattern.compile(
            "[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?"
                    + "(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+");

    public static boolean isMailbox(String value) {
        return value != null && value.length() <= 254 && MAILBOX.matcher(value).matches();
    }

    public boolean isConfigured() {
        return enabled && hasText(gmailClientId) && hasText(gmailClientSecret)
                && hasText(gmailRefreshToken) && isMailbox(senderEmail) && validOrigin();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean validOrigin() {
        try {
            URI uri = URI.create(frontendOrigin);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null
                    && uri.getUserInfo() == null && uri.getQuery() == null && uri.getFragment() == null
                    && (uri.getPath().isEmpty() || "/".equals(uri.getPath()));
        } catch (IllegalArgumentException | NullPointerException ex) {
            return false;
        }
    }

    public String resetLink(String token) {
        if (!validOrigin() || token == null || !token.matches("[A-Za-z0-9_-]{43}")) {
            throw new IllegalStateException("Password reset link configuration is invalid");
        }
        // Never use a request Host/Origin header to construct a credential-bearing link.
        // A fragment is not sent to the web server or included in HTTP Referer headers.
        return frontendOrigin.replaceAll("/$", "") + "/reset-password.html#token=" + token;
    }
}
