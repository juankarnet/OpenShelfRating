package com.openshelfrating.backend.catalog.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TitleAuthorNormalizerTest {

    private final TitleAuthorNormalizer normalizer = new TitleAuthorNormalizer();

    @Test
    void shouldNormalizeAccentsAndWhitespace() {
        String normalized = normalizer.normalize("  Cien   años   de Soledad  ");
        assertEquals("cien anos de soledad", normalized);
    }

    @Test
    void shouldBuildStableTitleAuthorKey() {
        String key = normalizer.buildTitleAuthorKey("The Hobbit", "J.R.R. Tolkien");
        assertEquals("the hobbit::j.r.r. tolkien", key);
    }
}
