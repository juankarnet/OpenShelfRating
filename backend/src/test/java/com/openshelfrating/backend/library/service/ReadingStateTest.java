package com.openshelfrating.backend.library.service;

import com.openshelfrating.backend.library.domain.ReadingState;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReadingStateTest {

    @Test
    void shouldExposePendingAsDefaultStateName() {
        assertEquals("PENDING", ReadingState.PENDING.name());
    }

    @Test
    void shouldAllowOnlyForwardTransitions() {
        assertTrue(ReadingState.PENDING.canTransitionTo(ReadingState.READING));
        assertTrue(ReadingState.READING.canTransitionTo(ReadingState.READ));

        assertFalse(ReadingState.PENDING.canTransitionTo(ReadingState.PENDING));
        assertFalse(ReadingState.PENDING.canTransitionTo(ReadingState.READ));
        assertFalse(ReadingState.READING.canTransitionTo(ReadingState.PENDING));
        assertFalse(ReadingState.READING.canTransitionTo(ReadingState.READING));
        assertFalse(ReadingState.READ.canTransitionTo(ReadingState.PENDING));
        assertFalse(ReadingState.READ.canTransitionTo(ReadingState.READING));
        assertFalse(ReadingState.READ.canTransitionTo(ReadingState.READ));
        assertFalse(ReadingState.PENDING.canTransitionTo(null));
    }
}
