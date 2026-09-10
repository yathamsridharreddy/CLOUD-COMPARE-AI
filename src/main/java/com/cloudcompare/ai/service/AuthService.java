package com.cloudcompare.ai.service;

import com.cloudcompare.ai.dto.SignupRequest;
import com.cloudcompare.ai.entity.UserEntity;
import com.cloudcompare.ai.exception.BusinessException;
import com.cloudcompare.ai.repository.UserRepository;
import com.cloudcompare.ai.security.PasswordPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserEntity registerUser(SignupRequest signupRequest) {
        // Elite Backend Validation
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new BusinessException("CRITICAL: Email synchronization failed - Account already exists.");
        }

        PasswordPolicy.validate(signupRequest.getPassword());

        UserEntity user = new UserEntity();
        user.setName(signupRequest.getName());
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));

        return userRepository.save(user);
    }
}
