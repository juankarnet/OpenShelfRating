package com.openshelfrating.backend.library.domain;

public enum ReadingState {
    PENDING,
    READING,
    READ;

    public boolean canTransitionTo(ReadingState nextState) {
        if (nextState == null) {
            return false;
        }
        return switch (this) {
            case PENDING -> nextState == READING;
            case READING -> nextState == READ;
            case READ -> false;
        };
    }
}
