package com.openshelfrating.backend.library.api;

import com.openshelfrating.backend.library.domain.ReadingState;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record UpdateReadingStateRequest(
        @NotNull ReadingState newState,
        OffsetDateTime readingDate
) {
}
