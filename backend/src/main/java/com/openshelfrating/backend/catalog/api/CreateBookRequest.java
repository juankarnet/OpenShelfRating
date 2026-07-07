package com.openshelfrating.backend.catalog.api;

import com.openshelfrating.backend.catalog.domain.BookGenre;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public record CreateBookRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 255) String primaryAuthor,
        @Size(max = 50) List<@Size(max = 255) String> otherAuthors,
        @Pattern(regexp = "^$|^[\\d-]{13,17}$", message = "isbn13 must be 13 digits (hyphens allowed)") String isbn13,
        @Pattern(regexp = "^$|^[\\d-]{9,12}[\\dX]$", message = "isbn10 must be 10 chars with optional final X (hyphens allowed)") String isbn10,
        @Size(max = 255) String publisher,
        LocalDate publicationDate,
        @Positive Integer pages,
        @Size(min = 2, max = 5) String language,
        Set<BookGenre> genres,
        @Size(max = 2048) String coverUrl
) {
}
