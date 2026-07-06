package com.openshelfrating.backend.library.api;

import com.openshelfrating.backend.library.domain.ReadingState;
import jakarta.validation.constraints.NotNull;

public record TransitionReadingStateRequest(
        @NotNull(message = "Reading state is required")
        ReadingState nextState,
        String readDate
) {}
