package com.openshelfrating.backend.media.api;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MediaUploadResponse(
        UUID uploadId,
        String presignedUrl,
        OffsetDateTime expiresAt,
        String mimeType,
        long fileSize
) {
}
