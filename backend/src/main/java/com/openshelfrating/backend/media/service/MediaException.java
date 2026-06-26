package com.openshelfrating.backend.media.service;

import org.springframework.http.HttpStatus;

public class MediaException extends RuntimeException {

    private final HttpStatus status;

    public MediaException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
