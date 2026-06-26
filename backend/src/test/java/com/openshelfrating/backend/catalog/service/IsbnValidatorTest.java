package com.openshelfrating.backend.catalog.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class IsbnValidatorTest {

    private final IsbnValidator isbnValidator = new IsbnValidator();

    @Test
    void shouldNormalizeIsbnByRemovingSpacesAndHyphens() {
        String normalized = isbnValidator.normalizeIsbn("978-0 306-40615-7");
        assertEquals("9780306406157", normalized);
    }

    @Test
    void shouldAcceptValidIsbn13() {
        assertDoesNotThrow(() -> isbnValidator.validateIsbn13("9780306406157"));
    }

    @Test
    void shouldRejectInvalidIsbn13() {
        assertThrows(CatalogException.class, () -> isbnValidator.validateIsbn13("9780306406158"));
    }

    @Test
    void shouldAcceptValidIsbn10() {
        assertDoesNotThrow(() -> isbnValidator.validateIsbn10("0306406152"));
    }

    @Test
    void shouldRejectInvalidIsbn10() {
        assertThrows(CatalogException.class, () -> isbnValidator.validateIsbn10("0306406153"));
    }
}
