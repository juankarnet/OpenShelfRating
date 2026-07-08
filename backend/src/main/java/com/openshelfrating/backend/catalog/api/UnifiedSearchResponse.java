package com.openshelfrating.backend.catalog.api;

import java.util.List;

public record UnifiedSearchResponse(
        List<UnifiedSearchResult> results,
        int count,
        String query,
        List<String> searchedSources,
        boolean externalSearchFailed
) {
}
