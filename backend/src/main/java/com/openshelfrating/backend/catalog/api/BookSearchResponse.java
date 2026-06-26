package com.openshelfrating.backend.catalog.api;

import java.util.UUID;

public record BookSearchResponse(
        UUID bookId,
        String title,
        String primaryAuthor,
        String coverUrl
) {
}
