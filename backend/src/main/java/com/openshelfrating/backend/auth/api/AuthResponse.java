package com.openshelfrating.backend.auth.api;

import com.openshelfrating.backend.auth.domain.UserRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuthResponse(
        UUID userId,
        String email,
        UserRole role,
        String token,
        OffsetDateTime expiresAt
) {
}
