package com.openshelfrating.backend.catalog.service;

import org.springframework.stereotype.Component;

import java.text.Normalizer;

@Component
public class TitleAuthorNormalizer {

    public String normalize(String value) {
        if (value == null) {
            return "";
        }

        String lowerTrimmed = value.trim().toLowerCase();
        String decomposed = Normalizer.normalize(lowerTrimmed, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}", "").replaceAll("\\s+", " ");
    }

    public String buildTitleAuthorKey(String title, String primaryAuthor) {
        return normalize(title) + "::" + normalize(primaryAuthor);
    }
}
