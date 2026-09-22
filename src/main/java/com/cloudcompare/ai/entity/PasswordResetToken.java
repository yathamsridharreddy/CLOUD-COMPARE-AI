package com.cloudcompare.ai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Stores only a SHA-256 digest; the bearer token never enters the database. */
@Entity
@Table(name = "password_reset_tokens", indexes = {
        @Index(name = "password_reset_user_created_idx", columnList = "user_id,created_at"),
        @Index(name = "password_reset_created_idx", columnList = "created_at"),
        @Index(name = "password_reset_expiry_idx", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetToken {
    @Id
    @Column(name = "token_hash", length = 64, nullable = false)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;
}
