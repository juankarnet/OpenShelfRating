package com.openshelfrating.backend.media.api;

import java.time.OffsetDateTime;

public record MediaAccessResponse(
        String url,
        OffsetDateTime expiresAt,
        boolean placeholder
) {
}
