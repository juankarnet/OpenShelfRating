package com.openshelfrating.backend.library.api;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddToLibraryRequest(
        @NotNull UUID bookId
) {
}
