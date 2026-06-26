package com.openshelfrating.backend.catalog.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class IsbnValidator {

    public String normalizeIsbn(String raw) {
        if (raw == null) {
            return null;
        }
        String normalized = raw.replace("-", "").replace(" ", "").trim().toUpperCase();
        return normalized.isBlank() ? null : normalized;
    }

    public void validateIsbn13(String isbn13) {
        if (isbn13 == null) {
            return;
        }
        if (!isbn13.matches("\\d{13}")) {
            throw new CatalogException(HttpStatus.BAD_REQUEST, "ISBN-13 must have exactly 13 digits");
        }

        int checksum = 0;
        for (int i = 0; i < 12; i++) {
            int digit = Character.getNumericValue(isbn13.charAt(i));
            checksum += (i % 2 == 0) ? digit : digit * 3;
        }
        int expectedCheckDigit = (10 - (checksum % 10)) % 10;
        int actualCheckDigit = Character.getNumericValue(isbn13.charAt(12));

        if (expectedCheckDigit != actualCheckDigit) {
            throw new CatalogException(HttpStatus.BAD_REQUEST, "Invalid ISBN-13 checksum");
        }
    }

    public void validateIsbn10(String isbn10) {
        if (isbn10 == null) {
            return;
        }
        if (!isbn10.matches("\\d{9}[\\dX]")) {
            throw new CatalogException(HttpStatus.BAD_REQUEST, "ISBN-10 must have 10 chars with optional final X");
        }

        int checksum = 0;
        for (int i = 0; i < 9; i++) {
            checksum += (isbn10.charAt(i) - '0') * (10 - i);
        }

        char checkChar = isbn10.charAt(9);
        checksum += (checkChar == 'X' ? 10 : checkChar - '0');

        if (checksum % 11 != 0) {
            throw new CatalogException(HttpStatus.BAD_REQUEST, "Invalid ISBN-10 checksum");
        }
    }
}
