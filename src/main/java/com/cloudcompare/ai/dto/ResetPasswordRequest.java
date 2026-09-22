package com.cloudcompare.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {
    @NotBlank(message = "The reset link is invalid or has expired. Request a new link.")
    @Pattern(regexp = "[A-Za-z0-9_-]{43}", message = "The reset link is invalid or has expired. Request a new link.")
    private String token;

    @NotBlank(message = "Enter a new password.")
    @Size(min = 8, max = 72, message = "Use a password between 8 and 72 characters.")
    private String newPassword;

    // Spring MVC debug logging must not print the token or new password.
    @Override
    public String toString() {
        return "ResetPasswordRequest[redacted]";
    }
}
