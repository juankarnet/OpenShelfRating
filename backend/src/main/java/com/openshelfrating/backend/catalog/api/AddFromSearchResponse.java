package com.openshelfrating.backend.catalog.api;

import java.util.UUID;

public record AddFromSearchResponse(
        UUID bookId,
        UUID userBookId,
        boolean createdInSystem,
        UnifiedSearchStatus status
) {
}
