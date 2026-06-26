package com.openshelfrating.backend.auth.api;

import com.openshelfrating.backend.auth.service.AuthService;
import com.openshelfrating.backend.auth.service.AuthException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "User registered. Check email for verification link."));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/social-callback")
    public ResponseEntity<ApiErrorResponse> socialCallback(@Valid @RequestBody SocialCallbackRequest request) {
        throw new AuthException(HttpStatus.NOT_IMPLEMENTED,
                "Social callback is pending provider integration. Configure OAuth env vars and implement provider token exchange.");
    }

    @GetMapping("/verify-email")
    public Map<String, String> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return Map.of("message", "Email verified successfully");
    }
}
