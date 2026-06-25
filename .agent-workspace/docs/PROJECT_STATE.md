# Living Document: Project State Snapshot

## 1. Milestone Status
*   **Current Milestone:** State 0 - Inception
*   **Current Gate:** Functional Alignment LOCKED; Technical Alignment pending
*   **Last Sync:** [SYNC: APPLICATION_CONTEXT.md] 2026-06-25
*   **Commit Target:** `status(inception): technical-manifest-locked`

## 2. Canonical Sources
*   **Global Policy:** `.github/copilot-instructions.md`
*   **Orchestration:** `.agent-workspace/INCEPTION_SCRIPT.md`
*   **Functional Context:** `.agent-workspace/docs/APPLICATION_CONTEXT.md`
*   **Technical Context:** `.agent-workspace/docs/TECHNICAL_MANIFEST.md`

## 3. Current Stack
*   **Selected Stack:** Java 21 + Spring Boot 3.x | PostgreSQL 15+ | S3-compatible media | React 18 + Vite | React Native (Expo)
*   **Architecture Pattern:** Hexagonal/Clean Architecture monolith backend + dual clients (web SPA + Android native)
*   **Testing Stack:** Backend Unit+Integration (JUnit5 + Testcontainers); Web Unit+E2E (Vitest + Playwright); Mobile (Detox or RNTL)
*   **Auth:** JWT RS256 + OAuth 2.0/OIDC (Google, Apple, Microsoft)
*   **API Contract:** OpenAPI 3.1 auto-generated

## 4. Open Decisions
*   **Functional:** MVP scope locked. AI photo ingestion deferred beyond MVP.
*   **Technical:** LOCKED for Milestone 0.2. Stack, architecture, clients, and testing strategy defined.

## 5. Active Constraints
*   **Policy Source:** `.github/copilot-instructions.md`
*   **Gate Validation:** `.agent-workspace/scripts/validate-gates.ps1`