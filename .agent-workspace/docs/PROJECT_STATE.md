# Living Document: Project State Snapshot

## 1. Milestone Status
*   **Current Milestone:** State 12 - Frontend Navigation & Dashboard (SPEC-0006)
*   **Current Gate:** SPEC-0006 implementation in progress; frontend delivered (including post-phase UX/media updates), backend runtime/integration validation pending.
*   **Last Sync:** [SYNC: PROJECT_STATE.md] 2026-07-07 12:42:00 +02:00
*   **Commit Target:** `SPEC-0006: close backend runtime + frontend-backend E2E validation`

## 2. Canonical Sources
*   **Global Policy:** `.github/copilot-instructions.md`
*   **Functional Context:** `.agent-workspace/docs/APPLICATION_CONTEXT.md`
*   **Technical Context:** `.agent-workspace/docs/TECHNICAL_MANIFEST.md`
*   **Functional Specifications:** `.agent-workspace/docs/spec/SPEC-000X/SPEC-000X.md`
*   **Technical Plans:** `.agent-workspace/docs/spec/SPEC-000X/SPEC-000X_TechnicalPlan.md`

## 3. Current Stack
*   **Backend:** Java 21 + Spring Boot 4.1.0 + Spring Data JPA + Flyway + PostgreSQL
*   **Architecture:** Hexagonal/Clean Architecture
*   **Build System:** Gradle (Maven artifacts removed)
*   **Testing:** JUnit 5 + Testcontainers (integration/E2E evidence still pending for SPEC-0006 closure)

## 4. Specification Status (MVP)
*   **SPEC-0001:** ✅ Implemented
*   **SPEC-0002:** ✅ Implemented (baseline committed)
*   **SPEC-0003:** ✅ Implemented (baseline)
*   **SPEC-0004:** ✅ Implemented (baseline)
*   **SPEC-0005:** ✅ Implemented (frontend media/profile flow committed)
*   **SPEC-0006:** 🟡 In Progress (frontend phases implemented; backend compile/E2E validation pending)

## 5. Completed Milestones
*   **SPEC-0001:** Identity & Access implemented and compiled.
*   **Specification Governance:** Standard folder model applied (`SPEC-000X/` + spec/technical plan split).
*   **SPEC-0003 (Personal Library Management):**
    - Implemented:
      - Flyway migration `V3__create_user_library_tables.sql` with partial unique index for active rows.
      - Domain model (`UserBook`, `ReadingState`).
      - Repository (`UserBookRepository`) with filtering/search support.
      - Service layer (`UserLibraryService`, `LibraryException`) with owner/admin authorization, soft delete, and reactivation behavior.
      - API (`UserLibraryController`, DTOs, `LibraryExceptionHandler`) for add/remove/list/stats endpoints.
      - Unit test baseline (`ReadingStateTest`).
    - Validation:
      - `./gradlew.bat compileJava` ✅
      - `./gradlew.bat test` ✅
*   **SPEC-0004 (Reading Lifecycle & Reviews):**
    - Implemented:
      - Flyway migration `V4__add_reading_lifecycle_to_user_books.sql`.
      - Domain extensions in `UserBook` (rating/opinion/reviewUpdatedAt).
      - State transition audit model (`ReadingStateTransition`) and repository.
      - Dedicated services (`ReadingLifecycleService`, `LibraryReviewService`).
      - API endpoints for state transition, review upsert, and review retrieval.
      - Transition constraint logic (`ReadingState.canTransitionTo`) and unit tests update.
    - Validation:
      - `./gradlew.bat compileJava` ✅
      - `./gradlew.bat test` ✅
*   **SPEC-0005 (Media Management):**
    - Implemented:
      - Flyway migration `V5__create_media_uploads_tables.sql`.
      - Media domain/repository (`MediaUpload`, `MediaResourceType`, `MediaUploadRepository`).
      - S3 integration setup (`MediaProperties`, `S3ClientConfig`, `AwsS3StorageAdapter`).
      - Media service and API for avatar/cover upload, retrieval (presigned URL JSON), and delete.
      - Permission model: avatar owner/admin, cover create for authenticated actor when absent, cover replace/delete admin only.
      - User profile integration with `avatarUrl` and media validation unit tests.
    - Validation:
      - `./gradlew.bat compileJava` ✅
      - `./gradlew.bat test` ✅

## 6. Completed Milestone (Latest)
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

## 7. Post-Implementation Backlog (SPEC-0002)
*   Add integration tests for dedup/search with PostgreSQL/Testcontainers.
*   Replace temporary `actorUserId` request parameter with authenticated JWT principal identity.
*   Execute AC-focused E2E checks (AC-001 to AC-005) with evidence.

## 8. Active Constraints
*   Keep traceability between `REQ/NFR/AC/RULE` and implementation.
*   Keep specification and `PROJECT_STATE.md` status synchronized before each `SPEC-XXXX` commit.

## 9. Frontend Delivery Snapshot
*   **SPEC-0001 (frontend):** ✅ committed (`125e43d`)
*   **SPEC-0002 (frontend):** ✅ committed (`1b4ed08`)
*   **SPEC-0003 (frontend):** ✅ committed (`a08feae`)
*   **SPEC-0004 (frontend):** ✅ committed (`6a9001a`)
*   **SPEC-0005 (frontend):** ✅ committed (`285cd67`) - avatar upload/management integrated in profile flow
*   **SPEC-0006 (frontend):** ✅ implemented across phases 1-9 + UX/modal enhancements (`8fd20bb`, `0ad1965`, `25d9a4a`, `bcdc2ed`, `eeed5b0`, `4682822`)

## 10. SPEC-0006 Delivery Snapshot (Current)
*   **Frontend:**
  - ✅ Routing, guards, and session persistence.
  - ✅ Dashboard/library views with pagination, filters, and modals.
  - ✅ Profile page (edit displayName + logout confirmation).
  - ✅ Add Book flow (catalog search + manual create + add to library).
  - ✅ Settings placeholder and Help documentation page.
*   **Backend:**
  - ✅ DTO alignment and library API extensions for state/review workflows.*   **Pending to close SPEC-0006:**  - Stabilize local backend startup in target Java runtime and capture evidence.
  - Stabilize local frontend dev startup and capture evidence.
  - Execute E2E frontend-backend integration checks.
  - Collect evidence for AC closure and final status update.
