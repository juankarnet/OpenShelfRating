package com.openshelfrating.backend.catalog.api;

import java.util.List;

public record BooksPagedResponse(
        List<BookSearchResponse> books,
        int page,
        int size,
        long totalCount
) {
}
