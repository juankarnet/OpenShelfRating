package com.openshelfrating.backend.catalog.api;

import java.util.UUID;

public record BookDeletionEligibilityResponse(
        UUID bookId,
        boolean canDeleteSystemBook,
        long activeLinksCount,
        String reason
) {
}
