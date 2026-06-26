package com.openshelfrating.backend.library.api;

public record UserLibraryStatsResponse(
        long totalBooks,
        long pendingCount,
        long readingCount,
        long readCount
) {
}
