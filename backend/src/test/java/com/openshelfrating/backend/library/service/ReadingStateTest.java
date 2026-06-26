package com.openshelfrating.backend.library.service;

import com.openshelfrating.backend.library.domain.ReadingState;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReadingStateTest {

    @Test
    void shouldExposePendingAsDefaultStateName() {
        assertEquals("PENDING", ReadingState.PENDING.name());
    }
}
