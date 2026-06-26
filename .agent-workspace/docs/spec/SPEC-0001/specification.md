# Specification: SPEC-0001 - Identity & Access Management

## 1. Metadata
*   **Spec ID:** SPEC-0001
*   **Version:** 1.0.0
*   **Status:** Implemented
*   **Owner:** BA Agent, Architect Agent
*   **Source Milestone:** Functional Alignment
*   **Last Updated:** 2026-06-26
*   **Implementation Completed:** 2026-06-26

## 2. Scope Definition
*   **Problem Statement:** Users need account creation and authentication via local or social identity providers with proper email uniqueness enforcement.
*   **Business Outcome:** Fast onboarding, reduced friction, single email-based identity across providers.
*   **In-Scope:** User registration (email+password, Google OAuth, Apple Sign-In, Microsoft Identity), email verification, profile management, role assignment (user/admin).
*   **Out-of-Scope:** Multi-factor authentication, LDAP/SAML, third-party identity aggregation services.

## 3. Actors & Preconditions
*   **Primary Actors:** Anonymous user (registration), authenticated user (profile updates), system administrator.
*   **Dependencies:** Google OAuth 2.0, Apple Sign-In API, Microsoft Identity Platform, email service (SMTP).
*   **Preconditions:** System running, email service available, OAuth credentials configured in backend.

## 4. Functional Requirements
*   **REQ-001:** Allow user registration via email + password with password validation (min 8 chars, uppercase, number, special char).
*   **REQ-002:** Allow social sign-up/login via Google, Apple, and Microsoft using OAuth 2.0/OIDC.
*   **REQ-003:** Link multiple social identities to one user account if verified email matches.
*   **REQ-004:** Validate email ownership via confirmation link; require verification before account activation.
*   **REQ-005:** Assign default role `USER` on account creation; support admin role override by system administrators.
*   **REQ-006:** Provide endpoints: POST /auth/register, POST /auth/login, POST /auth/social-callback, PUT /users/{id}/profile.
*   **REQ-007:** Return JWT token (RS256 signed, 24h expiry) on successful authentication.

## 5. Non-Functional Requirements
*   **NFR-001:** Email verification timeout: 24 hours.
*   **NFR-002:** JWT token expiry: 24 hours; refresh token (optional, deferred).
*   **NFR-003:** Password hashing: bcrypt with salt rounds ≥10.
*   **NFR-004:** OAuth token exchange latency: <2s; retry on transient failures ≤3 times.

## 6. Business Rules
*   **RULE-001:** User email is case-insensitive and must be unique in system (canonical form).
*   **RULE-002:** Social provider account is linked by matching verified email; if no match, require user email confirmation.
*   **RULE-003:** Unverified accounts cannot access protected resources; verification reminders sent at 6h, 18h, 24h before deletion.
*   **RULE-004:** Password reset via email link (valid 1 hour) only; no SMS-based recovery in MVP.
*   **RULE-005:** Admin can manually verify user email if dispute arises; audit log captured.

## 7. Acceptance Criteria
*   **AC-001:** Register new user with email + password; user receives verification email within 5s; link works for 24h.
*   **AC-002:** Sign up via Google OAuth; email verified automatically; account activated immediately.
*   **AC-003:** Unverified user attempts API call; receives 403 Unauthorized; verification prompt shown on client.
*   **AC-004:** Link Apple identity to existing user; second login via Apple succeeds with same account.
*   **AC-005:** Password reset flow: request reset → email sent → link valid 1h → update password → login succeeds.
*   **AC-006:** JWT token payload contains user_id, email, role, iat, exp; signature verifiable by public key.

## 8. Traceability
*   **Source Context:** APPLICATION_CONTEXT.md#2 (Capability 01), #3 (BR-04, BR-05, BR-06)
*   **Related Technical Manifest:** TECHNICAL_MANIFEST.md#5 (OAuth 2.0/OIDC, JWT RS256)
*   **Downstream Work Items:** Repository for User entity, JWT token service, Spring Security OAuth2 config, integration tests.
*   **Related Technical Plan:** See `technical-plan.md` in this directory.

## 9. Open Questions / Risks
*   **Q-001:** Should admin passwordless login (e.g., magic link) be MVP or Phase 2?
*   **R-001:** Social provider API rate limits; implement retry/backoff strategy.
*   **R-002:** Email service downtime blocks registration; consider async queue + fallback notification.
