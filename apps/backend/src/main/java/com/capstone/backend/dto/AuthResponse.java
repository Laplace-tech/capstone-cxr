package com.capstone.backend.dto;

public class AuthResponse {

    private final String tokenType;
    private final String accessToken;
    private final long expiresInMs;
    private final String email;

    public AuthResponse(String accessToken, long expiresInMs, String email) {
        this.tokenType = "Bearer";
        this.accessToken = accessToken;
        this.expiresInMs = expiresInMs;
        this.email = email;
    }

    public String getTokenType() {
        return tokenType;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public long getExpiresInMs() {
        return expiresInMs;
    }

    public String getEmail() {
        return email;
    }
}
