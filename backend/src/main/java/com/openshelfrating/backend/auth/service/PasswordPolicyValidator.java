package com.openshelfrating.backend.auth.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class PasswordPolicyValidator {

    private static final String PASSWORD_REGEX = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,100}$";

    public void validate(String password) {
        if (password == null || !password.matches(PASSWORD_REGEX)) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain at least 8 characters, one uppercase letter, one number, and one special character"
            );
        }
    }
}
