package com.openshelfrating.backend.catalog.api;

import com.openshelfrating.backend.catalog.domain.BookGenre;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record UnifiedSearchResult(
        UUID bookId,
        String title,
        String primaryAuthor,
        List<String> otherAuthors,
        String isbn13,
        String isbn10,
        String publisher,
        LocalDate publicationDate,
        Integer pages,
        String language,
        Set<BookGenre> genres,
        String coverUrl,
        UnifiedSearchSource source,
        UnifiedSearchStatus status,
        MetadataCompletionStatus metadataCompletionStatus,
        String externalSourceId
) {
}
