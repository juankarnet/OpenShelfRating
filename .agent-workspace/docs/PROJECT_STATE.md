# Living Document: Project State Snapshot

## 1. Milestone Status
*   **Current Milestone:** State 2 - SPEC-0001 Backend Implementation Complete
*   **Current Gate:** SPEC-0001 (Identity & Access Management) implementation verified
*   **Last Sync:** [SYNC: SPEC-0001.md] 2026-06-26
*   **Commit Target:** `feat(auth): implement SPEC-0001 - identity & access management with JWT RS256 and email verification`

## 2. Canonical Sources
*   **Global Policy:** `.github/copilot-instructions.md`
*   **Orchestration:** `.agent-workspace/INCEPTION_SCRIPT.md`
*   **Functional Context:** `.agent-workspace/docs/APPLICATION_CONTEXT.md`
*   **Technical Context:** `.agent-workspace/docs/TECHNICAL_MANIFEST.md`
*   **Functional Specifications:** `.agent-workspace/docs/spec/SPEC-000*.md`

## 3. Current Stack
*   **Selected Stack:** Java 21 + Spring Boot 3.x | PostgreSQL 15+ | S3-compatible media | React 18 + Vite | React Native (Expo)
*   **Architecture Pattern:** Hexagonal/Clean Architecture monolith backend + dual clients (web SPA + Android native)
*   **Testing Stack:** Backend Unit+Integration (JUnit5 + Testcontainers); Web Unit+E2E (Vitest + Playwright); Mobile (Detox or RNTL)
*   **Auth:** JWT RS256 + OAuth 2.0/OIDC (Google, Apple, Microsoft)
*   **API Contract:** OpenAPI 3.1 auto-generated

## 4. Generated Specifications (MVP)
*   **SPEC-0001:** Identity & Access Management (registration, OAuth2/OIDC, JWT)
*   **SPEC-0002:** Global Book Catalog (deduplication, search, metadata)
*   **SPEC-0003:** Personal Library Management (add/remove, state filtering)
*   **SPEC-0004:** Reading Lifecycle & Reviews (state transitions, ratings, opinions)
*   **SPEC-0005:** Media Management (avatar uploads, book covers, S3 storage)

## 5. Active Constraints
*   **Policy Source:** `.github/copilot-instructions.md`
*   **Gate Validation:** `.agent-workspace/scripts/validate-gates.ps1`

## 6. Implementation Milestones Completed
*   **SPEC-0001 (Identity & Access Management)** — ✅ Completed 2026-06-26
    - Domain entities: `UserAccount`, `EmailVerificationToken`, `UserRole`
    - Services: Auth, JWT, Email verification, Password validation
    - API endpoints: Register, Login, Verify Email, Get Profile, Update Profile
    - Database schema: Flyway V1 migration with users + email_verification_tokens
    - JWT: RS256 with 24h expiration (ephemeral or PEM-configurable)
    - Email verification: 24h token expiration, one-time use
    - Password policy: 8+ chars, uppercase, number, special character
    - Build: Spring Mail + Spring Security OAuth2 dependencies added
    - Status: Zero compilation errors, ready for runtime testing with PostgreSQL + MailHog