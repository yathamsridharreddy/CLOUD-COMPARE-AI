package com.cloudcompare.ai.security;

import com.cloudcompare.ai.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PasswordPolicyTest {
    @ParameterizedTest
    @ValueSource(strings = {"Password1@", "AnotherStrong2#", "Allowed&Pass9"})
    void acceptsExistingComplexityRules(String value) {
        assertDoesNotThrow(() -> PasswordPolicy.validate(value));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "Short1@", "lowercase1@", "UPPERCASE1@", "NoNumbers@", "NoSpecial123", "Spaces Here1@"})
    void rejectsWeakOrBlankPasswords(String value) {
        assertThrows(BusinessException.class, () -> PasswordPolicy.validate(value));
    }

    @Test
    void resetRequestDoesNotExposeCredentialsInDebugLogs() {
        var request = new com.cloudcompare.ai.dto.ResetPasswordRequest();
        request.setToken("A".repeat(43));
        request.setNewPassword("SecretPassword1@");
        org.junit.jupiter.api.Assertions.assertFalse(request.toString().contains("SecretPassword"));
        org.junit.jupiter.api.Assertions.assertFalse(request.toString().contains("A".repeat(43)));
    }

    @Test
    void enforcesBcryptByteLimitWithoutSilentTruncation() {
        assertDoesNotThrow(() -> PasswordPolicy.validate("Aa1@" + "x".repeat(68)));
        assertThrows(BusinessException.class, () -> PasswordPolicy.validate("Aa1@" + "x".repeat(69)));
        assertThrows(BusinessException.class, () -> PasswordPolicy.validate("Aa1@" + "é".repeat(35)));
    }
}
