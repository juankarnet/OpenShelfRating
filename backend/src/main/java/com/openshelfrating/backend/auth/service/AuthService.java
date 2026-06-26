package com.openshelfrating.backend.auth.service;

import com.openshelfrating.backend.auth.api.AuthResponse;
import com.openshelfrating.backend.auth.api.LoginRequest;
import com.openshelfrating.backend.auth.api.RegisterRequest;
import com.openshelfrating.backend.auth.api.UpdateProfileRequest;
import com.openshelfrating.backend.auth.api.UserProfileResponse;
import com.openshelfrating.backend.auth.config.AuthProperties;
import com.openshelfrating.backend.auth.domain.EmailVerificationToken;
import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.auth.domain.UserRole;
import com.openshelfrating.backend.auth.repository.EmailVerificationTokenRepository;
import com.openshelfrating.backend.auth.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final VerificationEmailService verificationEmailService;
    private final JwtService jwtService;
    private final AuthProperties authProperties;

    public AuthService(
            UserAccountRepository userAccountRepository,
            EmailVerificationTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            PasswordPolicyValidator passwordPolicyValidator,
            VerificationEmailService verificationEmailService,
            JwtService jwtService,
            AuthProperties authProperties
    ) {
        this.userAccountRepository = userAccountRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.verificationEmailService = verificationEmailService;
        this.jwtService = jwtService;
        this.authProperties = authProperties;
    }

    public void register(RegisterRequest request) {
        String canonicalEmail = EmailCanonicalizer.canonicalize(request.email());

        if (userAccountRepository.existsByEmailIgnoreCase(canonicalEmail)) {
            throw new AuthException(HttpStatus.CONFLICT, "Email is already registered");
        }

        passwordPolicyValidator.validate(request.password());

        UserAccount user = new UserAccount();
        user.setEmail(canonicalEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        user.setRole(UserRole.USER);
        user.setEmailVerified(false);
        user = userAccountRepository.save(user);

        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setUser(user);
        verificationToken.setToken(UUID.randomUUID().toString().replace("-", ""));
        verificationToken.setExpiresAt(OffsetDateTime.now().plusHours(authProperties.getVerificationExpirationHours()));
        tokenRepository.save(verificationToken);

        String verificationUrl = authProperties.getBaseUrl() + "/auth/verify-email?token=" + verificationToken.getToken();
        verificationEmailService.sendVerificationEmail(user.getEmail(), verificationUrl);
    }

    public AuthResponse login(LoginRequest request) {
        String canonicalEmail = EmailCanonicalizer.canonicalize(request.email());

        UserAccount user = userAccountRepository.findByEmailIgnoreCase(canonicalEmail)
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (!user.isEmailVerified()) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Email not verified");
        }

        JwtService.TokenResult tokenResult = jwtService.generateToken(user);
        return new AuthResponse(user.getId(), user.getEmail(), user.getRole(), tokenResult.token(), tokenResult.expiresAt());
    }

    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST, "Invalid verification token"));

        if (verificationToken.getUsedAt() != null) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Verification token already used");
        }

        if (verificationToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Verification token expired");
        }

        UserAccount user = verificationToken.getUser();
        user.setEmailVerified(true);
        verificationToken.setUsedAt(OffsetDateTime.now());

        userAccountRepository.save(user);
        tokenRepository.save(verificationToken);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "User not found"));
        return new UserProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getAvatarUrl(),
            user.getRole(),
            user.isEmailVerified()
        );
    }

    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "User not found"));
        user.setDisplayName(request.displayName().trim());
        user = userAccountRepository.save(user);
        return new UserProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getAvatarUrl(),
            user.getRole(),
            user.isEmailVerified()
        );
    }
}
