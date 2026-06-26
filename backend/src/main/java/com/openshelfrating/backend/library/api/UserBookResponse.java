package com.openshelfrating.backend.library.api;

import com.openshelfrating.backend.catalog.api.BookSearchResponse;
import com.openshelfrating.backend.library.domain.ReadingState;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserBookResponse(
        UUID userBookId,
        BookSearchResponse book,
        ReadingState readingState,
        OffsetDateTime addedAt,
        OffsetDateTime startedReadingAt,
        OffsetDateTime completedReadingAt,
        OffsetDateTime deletedAt
) {
}
