package com.openshelfrating.backend.catalog.api;

import com.openshelfrating.backend.catalog.domain.BookGenre;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record AddFromSearchRequest(
        @NotNull UnifiedSearchSource source,
        UUID bookId,
        @Size(max = 255) String title,
        @Size(max = 255) String primaryAuthor,
        List<@Size(max = 255) String> otherAuthors,
        @Size(max = 17) String isbn13,
        @Size(max = 10) String isbn10,
        @Size(max = 255) String publisher,
        LocalDate publicationDate,
        Integer pages,
        @Size(min = 2, max = 5) String language,
        Set<BookGenre> genres,
        @Size(max = 2048) String coverUrl,
        @Size(max = 255) String externalSourceId
) {
}
