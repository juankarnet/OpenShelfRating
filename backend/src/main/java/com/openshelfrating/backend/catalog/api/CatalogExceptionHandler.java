package com.openshelfrating.backend.catalog.api;

import com.openshelfrating.backend.auth.api.ApiErrorResponse;
import com.openshelfrating.backend.catalog.service.CatalogException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class CatalogExceptionHandler {

    @ExceptionHandler(CatalogException.class)
    public ResponseEntity<ApiErrorResponse> handleCatalogException(CatalogException ex) {
        ApiErrorResponse error = new ApiErrorResponse(
                ex.getStatus().name(),
                ex.getMessage(),
                OffsetDateTime.now()
        );
        return ResponseEntity.status(ex.getStatus()).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("code", HttpStatus.BAD_REQUEST.name());
        response.put("message", "Validation failed");
        response.put("timestamp", OffsetDateTime.now());
        response.put("errors", fieldErrors);

        return ResponseEntity.badRequest().body(response);
    }
}
