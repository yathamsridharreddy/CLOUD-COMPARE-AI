package com.cloudcompare.ai.service;

import com.cloudcompare.ai.dto.SignupRequest;
import com.cloudcompare.ai.entity.UserEntity;
import com.cloudcompare.ai.exception.BusinessException;
import com.cloudcompare.ai.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private static final Pattern PASSWORD_PATTERN = Pattern
            .compile("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$");

    @Transactional
    public UserEntity registerUser(SignupRequest signupRequest) {
        // Elite Backend Validation
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new BusinessException("CRITICAL: Email synchronization failed - Account already exists.");
        }

        if (!PASSWORD_PATTERN.matcher(signupRequest.getPassword()).matches()) {
            throw new BusinessException(
                    "SECURITY ALERT: Password does not meet the vault-grade complexity requirements.");
        }

        UserEntity user = new UserEntity();
        user.setName(signupRequest.getName());
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));

        return userRepository.save(user);
    }
}
