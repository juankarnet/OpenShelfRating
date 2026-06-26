package com.openshelfrating.backend.auth.api;

import jakarta.validation.constraints.NotBlank;

public record SocialCallbackRequest(
        @NotBlank String provider,
        @NotBlank String idToken
) {
}
