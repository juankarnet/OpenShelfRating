package com.openshelfrating.backend.catalog.api;

import com.openshelfrating.backend.catalog.domain.BookGenre;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateBookRequest(
        @Size(max = 2048) String coverUrl,
        Set<BookGenre> genres,
        @Size(max = 255) String publisher,
        @Size(max = 1000) String metadataCorrections
) {
}
