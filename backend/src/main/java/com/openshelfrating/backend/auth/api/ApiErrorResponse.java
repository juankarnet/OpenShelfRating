package com.openshelfrating.backend.auth.api;

import java.time.OffsetDateTime;

public record ApiErrorResponse(
        String code,
        String message,
        OffsetDateTime timestamp
) {
}
