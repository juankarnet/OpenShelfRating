package com.openshelfrating.backend.catalog.api;

import java.util.Map;

public record BookStatsResponse(
        long totalBooks,
        Map<String, Long> totalByGenre,
        Map<String, Long> totalByLanguage
) {
}
