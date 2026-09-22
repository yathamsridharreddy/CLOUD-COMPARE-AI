package com.cloudcompare.ai.security;

import com.cloudcompare.ai.exception.BusinessException;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

public final class PasswordPolicy {
    private static final Pattern COMPLEXITY = Pattern.compile(
            "^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$");

    private PasswordPolicy() {
    }

    public static void validate(String password) {
        if (password == null || password.length() > 72
                || password.getBytes(StandardCharsets.UTF_8).length > 72
                || !COMPLEXITY.matcher(password).matches()) {
            throw new BusinessException("Use at least 8 characters with uppercase, lowercase, a number, "
                    + "and one of @#$%^&+=. No spaces; maximum 72 UTF-8 bytes.");
        }
    }
}
