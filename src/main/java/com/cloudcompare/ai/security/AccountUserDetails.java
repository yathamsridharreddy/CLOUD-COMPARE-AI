package com.cloudcompare.ai.security;

import com.cloudcompare.ai.entity.UserEntity;
import org.springframework.security.core.userdetails.User;

import java.util.List;

/** Carries a DB-backed credential generation without an additional JWT-filter query. */
public class AccountUserDetails extends User {
    private final int credentialVersion;

    public AccountUserDetails(UserEntity account) {
        super(account.getEmail(), account.getPassword(), List.of());
        this.credentialVersion = account.getCredentialVersion();
    }

    public int getCredentialVersion() {
        return credentialVersion;
    }
}
