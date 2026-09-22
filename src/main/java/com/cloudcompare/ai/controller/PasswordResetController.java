package com.cloudcompare.ai.controller;

import com.cloudcompare.ai.dto.ForgotPasswordRequest;
import com.cloudcompare.ai.dto.ResetPasswordRequest;
import com.cloudcompare.ai.service.PasswordResetRequestService;
import com.cloudcompare.ai.service.PasswordResetTokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {
    private final PasswordResetRequestService requests;
    private final PasswordResetTokenService tokens;

    public PasswordResetController(PasswordResetRequestService requests, PasswordResetTokenService tokens) {
        this.requests = requests;
        this.tokens = tokens;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        requests.request(request.getEmail());
        return ResponseEntity.accepted().body(Map.of("message", PasswordResetRequestService.ACCEPTED_MESSAGE));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> reset(@Valid @RequestBody ResetPasswordRequest request) {
        String email = tokens.complete(request.getToken(), request.getNewPassword());
        requests.notifyPasswordChanged(email);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password updated. Please sign in with your new password."));
    }
}
