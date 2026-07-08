package com.openshelfrating.backend.catalog.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UnifiedSearchRequest(
        @NotBlank String query,
        @Min(1) @Max(10) Integer limit
) {
}
