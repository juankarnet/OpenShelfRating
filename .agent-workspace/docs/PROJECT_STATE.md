# Living Document: Project State Snapshot

## 1. Milestone Status
*   **Current Milestone:** State 5 - SPEC-0002 Backend Implementation In Progress
*   **Current Gate:** Core implementation completed and verified; pending integration coverage and auth-principal alignment.
*   **Last Sync:** [SYNC: PROJECT_STATE.md] 2026-06-26
*   **Commit Target:** `SPEC-0002: implement global catalog backend baseline`

## 2. Canonical Sources
*   **Global Policy:** `.github/copilot-instructions.md`
*   **Functional Context:** `.agent-workspace/docs/APPLICATION_CONTEXT.md`
*   **Technical Context:** `.agent-workspace/docs/TECHNICAL_MANIFEST.md`
*   **Functional Specifications:** `.agent-workspace/docs/spec/SPEC-000X/SPEC-000X.md`
*   **Technical Plans:** `.agent-workspace/docs/spec/SPEC-000X/SPEC-000X_TechnicalPlan.md`

## 3. Current Stack
*   **Backend:** Java 21 + Spring Boot + Spring Data JPA + Flyway + PostgreSQL
*   **Architecture:** Hexagonal/Clean Architecture
*   **Testing:** JUnit 5 + Testcontainers (integration pending for SPEC-0002)

## 4. Specification Status (MVP)
*   **SPEC-0001:** ✅ Implemented
*   **SPEC-0002:** 🔄 In progress (implementation started)
*   **SPEC-0003:** 📋 Planned
*   **SPEC-0004:** 📋 Planned
*   **SPEC-0005:** 📋 Planned

## 5. Completed Milestones
*   **SPEC-0001:** Identity & Access implemented and compiled.
*   **Specification Governance:** Standard folder model applied (`SPEC-000X/` + spec/technical plan split).

## 6. In-Progress Milestone
*   **SPEC-0002 (Global Book Catalog)**
    - Implemented:
      - Flyway migration `V2__create_book_catalog_tables.sql`.
      - Domain model (`Book`, `BookGenre`, `BookDeduplicationKey`, `BookDeduplicationKeyType`).
      - Repositories (`BookRepository`, `BookDeduplicationKeyRepository`).
      - Services (`BookService`, `IsbnValidator`, `TitleAuthorNormalizer`, `CatalogException`).
      - API (`BookController`, DTOs, `CatalogExceptionHandler`).
      - Config + docs (`app.catalog.*` in backend properties and README).
      - Unit tests for validators/normalizer.
    - Validation:
      - `./gradlew.bat compileJava` ✅
      - `./gradlew.bat test` ✅

## 7. Pending Items (SPEC-0002)
*   Add integration tests for dedup/search with PostgreSQL/Testcontainers.
*   Replace temporary `actorUserId` request parameter with authenticated JWT principal identity.
*   Execute AC-focused E2E checks (AC-001 to AC-005) with evidence.

## 8. Active Constraints
*   Keep traceability between `REQ/NFR/AC/RULE` and implementation.
*   Do not start SPEC-0003 until SPEC-0002 gate is closed.