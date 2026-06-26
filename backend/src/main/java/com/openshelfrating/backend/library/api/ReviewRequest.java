package com.openshelfrating.backend.library.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @Min(1) @Max(5) Integer rating,
        @Size(max = 1000) String opinion
) {
}
