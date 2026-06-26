package com.openshelfrating.backend.auth.api;

import com.openshelfrating.backend.auth.domain.UserRole;

import java.util.UUID;

public record UserProfileResponse(
        UUID userId,
        String email,
        String displayName,
        UserRole role,
        boolean emailVerified
) {
}
