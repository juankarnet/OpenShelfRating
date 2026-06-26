package com.openshelfrating.backend.media.api;

import com.openshelfrating.backend.auth.api.ApiErrorResponse;
import com.openshelfrating.backend.media.service.MediaException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;

@RestControllerAdvice
public class MediaExceptionHandler {

    @ExceptionHandler(MediaException.class)
    public ResponseEntity<ApiErrorResponse> handleMediaException(MediaException ex) {
        ApiErrorResponse error = new ApiErrorResponse(
                ex.getStatus().name(),
                ex.getMessage(),
                OffsetDateTime.now()
        );
        return ResponseEntity.status(ex.getStatus()).body(error);
    }
}
