package com.openshelfrating.backend.auth.api;

import com.openshelfrating.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UserProfileController {

    private final AuthService authService;

    public UserProfileController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/{id}/profile")
    public UserProfileResponse getProfile(@PathVariable("id") UUID userId) {
        return authService.getProfile(userId);
    }

    @PutMapping("/{id}/profile")
    public UserProfileResponse updateProfile(
            @PathVariable("id") UUID userId,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return authService.updateProfile(userId, request);
    }
}
