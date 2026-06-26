package com.openshelfrating.backend.auth.service;

import java.util.Locale;

public final class EmailCanonicalizer {

    private EmailCanonicalizer() {
    }

    public static String canonicalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
