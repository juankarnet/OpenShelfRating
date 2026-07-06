package com.openshelfrating.backend.library.api;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserLibraryStatsResponse(
        long totalBooks,
        @JsonProperty("stateDistribution")
        StateDistribution stateDistribution,
        double averageRating
) {
    public record StateDistribution(
            long PENDING,
            long READING,
            long READ
    ) {}
}
