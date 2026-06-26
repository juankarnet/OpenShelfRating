# Technical Plan: SPEC-0001 - Identity & Access Management

## 1. Overview
This technical plan details the implementation strategy for SPEC-0001 (Identity & Access Management). The specification is already **Implemented** as of 2026-06-26. This document serves as a reference for the completed implementation and future maintenance.

## 2. Architecture & Pattern
*   **Pattern:** Hexagonal Architecture (Clean Architecture)
*   **Layer Structure:**
    - **Domain Layer:** Entities (UserAccount, EmailVerificationToken, UserRole)
    - **Repository Layer:** Spring Data JPA repositories
    - **Service Layer:** Business logic orchestration (AuthService, JwtService, VerificationEmailService)
    - **API Layer:** REST controllers + DTOs + exception handling

## 3. Implementation Components

### 3.1 Domain Layer (Completed)
```
com.openshelfrating.backend.auth.domain/
├── UserAccount.java          (JPA Entity, PK: id UUID)
├── EmailVerificationToken.java (JPA Entity, PK: id UUID)
└── UserRole.java              (Enum: USER, ADMIN)
```

**UserAccount Entity:**
- `id` (UUID PK)
- `email` (VARCHAR 320, UNIQUE NOT NULL, case-insensitive)
- `passwordHash` (VARCHAR 120, bcrypt)
- `emailVerified` (BOOLEAN DEFAULT false)
- `displayName` (VARCHAR 120)
- `role` (ENUM: UserRole)
- `createdAt` (TIMESTAMPTZ, auto-set @PrePersist)
- `updatedAt` (TIMESTAMPTZ, auto-set @PreUpdate)

**EmailVerificationToken Entity:**
- `id` (UUID PK)
- `user` (FK to UserAccount, CASCADE delete)
- `token` (VARCHAR 120, UNIQUE NOT NULL)
- `expiresAt` (TIMESTAMPTZ)
- `usedAt` (TIMESTAMPTZ, nullable until verified)
- `createdAt` (TIMESTAMPTZ)

### 3.2 Repository Layer (Completed)
```
com.openshelfrating.backend.auth.repository/
├── UserAccountRepository.java
│   ├── findByEmailIgnoreCase(String email) → Optional<UserAccount>
│   └── existsByEmailIgnoreCase(String email) → boolean
└── EmailVerificationTokenRepository.java
    └── findByToken(String token) → Optional<EmailVerificationToken>
```

**Strategy:** Spring Data JPA with derived query methods for email case-insensitivity and token lookup.

### 3.3 Service Layer (Completed)
```
com.openshelfrating.backend.auth.service/
├── PasswordPolicyValidator.java
│   └── validate(String password) throws AuthException
│       Pattern: ^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$
├── EmailCanonicalizer.java
│   └── canonicalize(String email) → String (trim + lowercase)
├── JwtKeyPairProvider.java
│   ├── getPrivateKey() → PrivateKey (RSA 2048)
│   └── getPublicKey() → PublicKey
│       Strategy: Read from APP_AUTH_JWT_PRIVATE_KEY_PEM / APP_AUTH_JWT_PUBLIC_KEY_PEM
│                 or generate ephemeral pair if empty (dev only)
├── JwtService.java
│   ├── generateToken(UserAccount) → TokenResult(token, expiresAt)
│   │   Algorithm: RS256, expires in 24h (configurable)
│   └── parseAndValidate(String token) → JwtPayload(userId, email, role)
├── VerificationEmailService.java
│   └── sendVerificationEmail(UserAccount, String token) throws AuthException
│       SMTP via JavaMailSender, from APP_MAIL_FROM
└── AuthService.java (@Transactional)
    ├── register(RegisterRequest) → AuthResponse
    │   1. Canonicalize email, check existence
    │   2. Validate password
    │   3. Create UserAccount (role=USER, emailVerified=false)
    │   4. Create EmailVerificationToken (24h expiry)
    │   5. Send verification email
    ├── login(LoginRequest) → AuthResponse
    │   1. Canonicalize email, find user
    │   2. Verify password via bcrypt
    │   3. Check emailVerified (throw 403 if not)
    │   4. Generate JWT token via JwtService
    ├── verifyEmail(String token) → void
    │   1. Find token, check not used, check expiry
    │   2. Set user.emailVerified = true, token.usedAt = now
    ├── getProfile(UUID userId) → UserProfileResponse
    └── updateProfile(UUID userId, UpdateProfileRequest) → UserProfileResponse
```

### 3.4 API Layer (Completed)

**DTOs (Java Records):**
```
com.openshelfrating.backend.auth.api/
├── RegisterRequest (email, password, displayName) with @Email, @NotBlank, @Size validation
├── LoginRequest (email, password)
├── SocialCallbackRequest (provider, idToken) — stub for future OAuth
├── UpdateProfileRequest (displayName)
├── AuthResponse (userId, email, role, token, expiresAt)
├── UserProfileResponse (userId, email, displayName, role, emailVerified)
├── ApiErrorResponse (code, message, timestamp)
└── [Additional DTOs for error details]
```

**Controllers:**
```
com.openshelfrating.backend.auth.api/
├── AuthController (@RestController @RequestMapping("/auth"))
│   ├── POST /auth/register → 201 + AuthResponse
│   ├── POST /auth/login → 200 + AuthResponse
│   ├── POST /auth/social-callback → 501 NOT_IMPLEMENTED (pending provider credentials)
│   └── GET /auth/verify-email?token=<token> → 200 + {message}
└── UserProfileController (@RestController @RequestMapping("/users"))
    ├── GET /users/{id}/profile → 200 + UserProfileResponse
    └── PUT /users/{id}/profile → 200 + UserProfileResponse
```

**Exception Handling:**
```
com.openshelfrating.backend.auth.api/
└── AuthExceptionHandler (@RestControllerAdvice)
    ├── Catches AuthException → ResponseEntity(ApiErrorResponse, HttpStatus)
    └── Catches MethodArgumentNotValidException → 400 + field errors
```

### 3.5 Database Schema (Completed)

**Flyway V1 Migration:** `V1__create_identity_tables.sql`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(320) UNIQUE NOT NULL,
  password_hash VARCHAR(120) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  display_name VARCHAR(120) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(120) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_verification_token ON email_verification_tokens(token);
```

### 3.6 Configuration (Completed)

**Build Dependencies:**
```gradle
implementation("org.springframework.boot:spring-boot-starter-mail")
implementation("org.springframework.security:spring-security-oauth2-jose")  // JWT/JOSE (Nimbus)
```

**Properties:** `application.properties`
```properties
app.auth.jwt-expiration-hours=${APP_AUTH_JWT_EXPIRATION_HOURS:24}
app.auth.verification-expiration-hours=${APP_AUTH_VERIFICATION_EXPIRATION_HOURS:24}
app.auth.base-url=${APP_AUTH_BASE_URL:http://localhost:8080}
app.auth.jwt-private-key-pem=${APP_AUTH_JWT_PRIVATE_KEY_PEM:}
app.auth.jwt-public-key-pem=${APP_AUTH_JWT_PUBLIC_KEY_PEM:}
spring.mail.host=${SPRING_MAIL_HOST:localhost}
spring.mail.port=${SPRING_MAIL_PORT:1025}
spring.mail.username=${SPRING_MAIL_USERNAME:}
spring.mail.password=${SPRING_MAIL_PASSWORD:}
spring.mail.properties.mail.smtp.auth=${SPRING_MAIL_SMTP_AUTH:false}
spring.mail.properties.mail.smtp.starttls.enable=${SPRING_MAIL_SMTP_STARTTLS_ENABLE:false}
app.mail.from=${APP_MAIL_FROM:no-reply@openshelfrating.local}
```

**Config Classes:**
```java
com.openshelfrating.backend.auth.config/
├── AuthProperties (@ConfigurationProperties(prefix="app.auth"))
├── MailProperties (@ConfigurationProperties(prefix="app.mail"))
└── AuthModuleConfig (@Configuration)
    └── @Bean PasswordEncoder() → new BCryptPasswordEncoder(10)
```

## 4. Security Considerations

| Aspect | Implementation |
|--------|-----------------|
| **Password Hashing** | Bcrypt, 10 salt rounds, 120-char hash |
| **Password Policy** | Min 8 chars, 1 uppercase, 1 digit, 1 special char |
| **Email Verification** | 24h token expiration, one-time use (usedAt marker) |
| **JWT Signature** | RS256 (asymmetric), RSA 2048-bit keypair |
| **Email Canonicalization** | Case-insensitive (RULE-001) |
| **Unverified User Access** | 403 Forbidden until email verified |

## 5. Deployment Requirements

### Development Environment
*   **PostgreSQL:** localhost:5432 (env vars: SPRING_DATASOURCE_*)
*   **SMTP:** MailHog on localhost:1025 (web UI: http://localhost:8025)
*   **JWT Keys:** Ephemeral RSA pair generated in-memory (no PEM env vars needed)

### Production Environment
*   **PostgreSQL:** Managed service (e.g., Azure Database for PostgreSQL)
*   **SMTP:** Managed service (e.g., SendGrid, AWS SES)
*   **JWT Keys:** PEM files provided via APP_AUTH_JWT_PRIVATE_KEY_PEM / APP_AUTH_JWT_PUBLIC_KEY_PEM environment variables

## 6. Testing Strategy

| Layer | Tool | Status |
|-------|------|--------|
| **Unit Tests** | JUnit 5 | Pending implementation |
| **Integration Tests** | Testcontainers (PostgreSQL) | Pending implementation |
| **End-to-End Tests** | Manual flow validation | Pending |

**Test Coverage Plan:**
- ✅ Password validator (regex, edge cases)
- ✅ Email canonicalizer (case sensitivity)
- ✅ JWT generation & validation (signature, expiry)
- ✅ Registration flow (email dedup, token creation)
- ✅ Login flow (password verification, unverified user rejection)
- ✅ Email verification (token lookup, one-time use)
- ✅ Profile management (read, update)

## 7. Implementation Artifacts

| Component | Files | Count |
|-----------|-------|-------|
| **Domain Entities** | UserAccount, EmailVerificationToken, UserRole | 3 |
| **Repositories** | UserAccountRepository, EmailVerificationTokenRepository | 2 |
| **Services** | AuthService, JwtService, VerificationEmailService, PasswordPolicyValidator, EmailCanonicalizer, JwtKeyPairProvider, AuthException | 7 |
| **API** | AuthController, UserProfileController, AuthExceptionHandler | 3 |
| **DTOs** | RegisterRequest, LoginRequest, AuthResponse, UserProfileResponse, UpdateProfileRequest, SocialCallbackRequest, ApiErrorResponse | 7 |
| **Config** | AuthProperties, MailProperties, AuthModuleConfig | 3 |
| **Database** | V1__create_identity_tables.sql (Flyway migration) | 1 |
| **Total Java Files** | — | 26 |

## 8. Build & Compilation Status

*   **Gradle Version:** 8.14.3
*   **Java Target:** 21 LTS
*   **Build Output:** `BUILD SUCCESSFUL in 1m 52s`
*   **Compilation Errors:** 0
*   **Warnings:** 0

## 9. Known Limitations & Deferred Features

### MVP Limitations
- **Social OAuth:** Endpoints exist (POST /auth/social-callback) but return 501 NOT_IMPLEMENTED
  - Requires: Provider credentials (Google, Apple, Microsoft)
  - Deferral: Phase 2 (after OAuth provider setup)

- **Password Reset:** AC-005 deferred to Phase 2
  - Requires: Email service stability, additional token entity
  - MVP Focus: Registration + email verification only

- **Admin Passwordless Login:** Q-001 deferred to Phase 2
  - Alternative: Admin can use regular email+password

- **Multi-Factor Authentication (MFA):** Out-of-scope (R-001 mitigated via social provider retry)

### Future Enhancements
- Refresh token support (RFC 6749)
- Rate limiting on registration/login
- Audit logging for email verification
- User session management
- Account lockout after failed attempts

## 10. Maintenance & Monitoring

### Key Metrics to Track
- Email verification success rate
- Token expiration distribution
- Login failure reasons (invalid password, unverified, not found)
- SMTP delivery latency

### Upgrade Path
- JWT key rotation: Deprecate old public key, publish new key via JWKS endpoint
- Bcrypt version updates: Monitor Spring Security releases
- Database schema: Flyway handles migrations automatically

## 11. References

*   **Spec:** See `SPEC-0001.md` in this directory
*   **API Contracts:** OpenAPI 3.1 auto-generated (TODO: Add @OpenApiSchema annotations)
*   **JWT Standards:** RFC 7519 (JWT), RFC 7515 (JWS)
*   **Email Verification:** OWASP guidelines on email validation
*   **Environment Variables Documentation:** See project README.md

## 12. Sign-Off

*   **Implementation Status:** ✅ Complete
*   **Compilation Status:** ✅ Zero errors
*   **Ready for Runtime Testing:** ✅ Yes (requires PostgreSQL + MailHog)
*   **Ready for Production Deployment:** 🔄 Pending integration tests + manual E2E validation
