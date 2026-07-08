package com.openshelfrating.backend.catalog.api;

import com.openshelfrating.backend.catalog.domain.BookGenre;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record BookResponse(
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
        String synopsis,
        UUID createdBy,
        String createdByName,
        boolean canonical,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        boolean existing
) {
}
