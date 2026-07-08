# Technical Plan: SPEC-0004 - Reading Lifecycle & Reviews

## 1. Overview

## 1.1 Execution Status
**Spec Sync:** Implemented (Last Sync: 2026-07-08)

This technical plan outlines the implementation strategy for SPEC-0004 (Reading Lifecycle & Reviews). Status: **Implemented baseline**.

**Extension Planning Status (2026-07-07):**
- Backend prerequisites delivered and validated (`gradlew.bat test` successful).
- Next step is frontend implementation over the already aligned catalog/media API surface.

## 2. Architecture & Pattern
*   **Pattern:** State Machine on UserBook entity, enriched with review metadata
*   **Key Change:** Extend UserBook with rating, opinion, timestamps for state transitions

## 3. Implementation Components

### 3.1 Domain Layer Extensions

```
com.openshelfrating.backend.library.domain/
├── UserBook.java (extended)
│   ├── readingState (ENUM: PENDING, READING, READ)
│   ├── startedReadingAt (TIMESTAMPTZ, nullable)
│   ├── completedReadingAt (TIMESTAMPTZ, nullable)
│   ├── rating (INT 1-5, nullable)
│   └── opinion (VARCHAR 1000, nullable)
└── ReadingStateTransition.java (audit entity, optional)
    ├── id (UUID PK)
    ├── userBook (FK)
    ├── previousState (ENUM)
    ├── newState (ENUM)
    ├── transitionAt (TIMESTAMPTZ)
    └── reason (VARCHAR, nullable)
```

### 3.2 Service Layer

```
com.openshelfrating.backend.library.service/
├── ReadingLifecycleService (@Transactional)
│   ├── updateReadingState(UUID userId, UUID bookId, ReadingState newState, OffsetDateTime readingDate) → UserBookResponse
│   │   State machine logic: PENDING → READING → READ (unidirectional)
│   │
├── LibraryReviewService (@Transactional)
│   ├── submitReview(UUID userId, UUID bookId, ReviewRequest) → ReviewResponse
│   │   Only allowed if state = READ
│   │   Sets rating, opinion, reviewUpdatedAt
│   └── getReview(UUID userId, UUID bookId) → ReviewResponse
│       Returns full UserBook with state, dates, rating, opinion
```

### 3.3 API Layer

**DTOs:**
```java
record UpdateReadingStateRequest(
    ReadingState newState,
    OffsetDateTime readingDate  // optional, defaults to server timestamp
) {}

record ReviewRequest(
    Integer rating,           // 1-5, @Min(1) @Max(5)
    String opinion            // @Size(max=1000)
) {}

record ReviewResponse(
    UUID userBookId,
    BookSearchResponse book,
    ReadingState readingState,
    LocalDateTime addedAt,
    LocalDateTime startedReadingAt,
    LocalDateTime completedReadingAt,
    Integer rating,
    String opinion,
    LocalDateTime reviewUpdatedAt
) {}
```

**Controller Extensions:**
```java
@RestController
@RequestMapping("/users/{userId}/library/{bookId}")
public class ReadingLifecycleController {
    @PatchMapping("/state")
    public ResponseEntity<UserBookResponse> updateState(
        @PathVariable UUID userId,
        @PathVariable UUID bookId,
        @Valid @RequestBody UpdateReadingStateRequest request
    ) { /* 200 OK */ }
    
    @PostMapping("/review")
    public ResponseEntity<ReviewResponse> submitReview(
        @PathVariable UUID userId,
        @PathVariable UUID bookId,
        @Valid @RequestBody ReviewRequest request
    ) { /* 201 Created or 200 OK if update */ }
    
    @GetMapping
    public ResponseEntity<ReviewResponse> getReview(
        @PathVariable UUID userId,
        @PathVariable UUID bookId
    ) { /* 200 OK */ }
}
```

### 3.4 Database Schema

**Flyway V4 Migration:** `V4__add_reading_lifecycle_to_user_books.sql`

```sql
ALTER TABLE user_books ADD COLUMN (
    started_reading_at TIMESTAMPTZ,
    completed_reading_at TIMESTAMPTZ,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    opinion VARCHAR(1000),
    review_updated_at TIMESTAMPTZ
);

-- Mandatory audit table for state transitions
CREATE TABLE reading_state_transitions (
    id UUID PRIMARY KEY,
    user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    previous_state VARCHAR(20),
    new_state VARCHAR(20) NOT NULL,
    transition_at TIMESTAMPTZ NOT NULL,
    reason VARCHAR(255)
);

CREATE INDEX idx_state_transitions_userbook ON reading_state_transitions(user_book_id);
```

## 4. State Machine Logic

```
                ┌─────────────────┐
                │    PENDING      │
                │  (initial)      │
                └────────┬────────┘
                         │ updateState(READING)
                         │ set startedReadingAt
                         ↓
                ┌─────────────────┐
                │    READING      │
                │  (progress)     │
                └────────┬────────┘
                         │ updateState(READ)
                         │ set completedReadingAt
                         ↓
                ┌─────────────────┐
                │      READ       │
                │  (final)        │
                │  + allow review │
                └─────────────────┘
```

**Validation Rules:**
- ✅ PENDING → READING: Set startedReadingAt = readingDate if provided, otherwise system time
- ✅ READING → READ: Set completedReadingAt = readingDate if provided, otherwise system time
- ❌ Any other transition: Reject with 400 Bad Request
- ❌ Rating/opinion set if state ≠ READ: Reject with 400 Bad Request
- ❌ Opinion > 1000 chars: Reject with 400 Bad Request

**Audit Rule:**
- ✅ Every accepted state transition creates one row in `reading_state_transitions` with `transition_at` from server time.

## 5. Implementation Sequence

| Phase | Components | Duration |
|-------|-----------|----------|
| **1. DB Schema** | Flyway V4 migration | 0.5h |
| **2. Domain** | Extend UserBook, add ReadingStateTransition entity | 0.5h |
| **3. Service** | ReadingLifecycleService state machine | 1.5h |
| **4. API** | ReadingLifecycleController, DTOs | 0.5h |
| **5. Testing** | State transitions, review validation tests | 1h |
| **Total** | — | **~4 hours** |

## 6. Success Criteria
- ✅ All 7 REQs implemented
- ✅ All 5 ACs pass
- ✅ State machine enforced unidirectional (no reversal)
- ✅ Rating/opinion only settable on READ state
- ✅ Opinion max 1000 chars enforced
- ✅ Timestamps captured for all transitions
- ✅ NFR-001: Update <200ms
- ✅ Integration tests pass

## 7. Frontend Implementation Steps (Web + Mobile)

### 7.1 Web (React)
- Implement reading state transition form (`PENDING` -> `READING` -> `READ`) bound to `PATCH /users/{userId}/library/{bookId}/state`.
- Implement review upsert form (rating 1-5, opinion <= 1000) bound to `POST /users/{userId}/library/{bookId}/review`.
- Implement review retrieval panel bound to `GET /users/{userId}/library/{bookId}`.
- Reuse library list section to prefill `bookId` values and improve flow continuity with SPEC-0003.

### 7.2 Web Frontend Extension (Backend Prerequisites Delivered)

**Goal:** extend the existing popup/detail flow so users can edit allowed book metadata in-place, and align the manual creation form with the real backend contract already implemented.

**Impacted current frontend surfaces:**
- `web/src/components/Modals/BookDetailModal.tsx`
- `web/src/pages/AddBookPage.tsx`
- `web/src/api.ts`

**Confirmed current backend contract (source of truth for implementation planning):**
- `PUT /books/{id}?actorUserId=...` exists in backend and updates catalog metadata.
- `POST /books/{id}/cover` exists for cover upload.
- `DELETE /books/{id}/cover` exists for cover deletion.
- `POST /books?actorUserId=...` exists for catalog creation.

**Important alignment note:** backend catalog/media support and OpenAPI synchronization are now part of the current delivery baseline for this extension.

### 7.3 API Alignment Matrix (Validated)

**Book detail popup editable fields requested by user:**
- Requested: edit directly in popup.
- Current backend support: delivered for the full editable metadata slice.

**Fields currently editable through backend `UpdateBookRequest`:**
- `title`
- `primaryAuthor`
- `otherAuthors`
- `isbn13`
- `isbn10`
- `publisher`
- `publicationDate`
- `pages`
- `language`
- `genres`
- `coverUrl`
- `metadataCorrections`

**Cover permission model validated against current backend:**
- First cover upload when the book has no cover: creator or admin.
- Replacing an existing cover: creator or admin.
- Deleting an existing cover: creator or admin.

### 7.4 Add Book Form Alignment (Validated Against `CreateBookRequest`)

**Fields supported today by backend create API:**
- `title`
- `primaryAuthor`
- `otherAuthors`
- `isbn13`
- `isbn10`
- `publisher`
- `publicationDate`
- `pages`
- `language`
- `genres`
- `coverUrl`

**Fields currently present in frontend but not in backend create payload:**
- `description`

**Fields currently missing in frontend but supported by backend create payload:**
- `isbn10`
- `otherAuthors`
- `publicationDate`
- `pages`
- `genres` (this is the closest current backend concept to the requested "tipo de libro")

**User-request alignment to apply in frontend plan:**
- Remove the direct `coverUrl` input from the manual creation form.
- Remove the unsupported `description` field from the manual creation flow.
- Add a selector for `genres` / book type using the backend enum options:
    - `CLASSIC`
    - `FICTION`
    - `MYSTERY`
    - `THRILLER`
    - `ROMANCE`
    - `SCIENCE_FICTION`
    - `FANTASY`
    - `BIOGRAPHY`
    - `HISTORY`
    - `SELF_HELP`
    - `EDUCATION`
    - `TECHNICAL`
    - `POETRY`
    - `DRAMA`
    - `CHILDREN`
    - `YOUNG_ADULT`
- Add the missing creation fields that the API already supports and that are useful in MVP:
    - `isbn10`
    - `publicationDate`
    - `pages`
- Evaluate whether `otherAuthors` is exposed in MVP or deferred; backend already supports it.
- Keep cover upload as a separate media action after create/select flow, not as a free URL field.

### 7.5 Confirmed Web Implementation Sequence

1. Update frontend API typings and service layer to reflect the real backend `BookResponse`, `CreateBookRequest`, and `UpdateBookRequest` contract.
2. Refactor `BookDetailModal` into view/edit modes.
3. Persist popup edits for the backend-supported metadata slice through `PUT /books/{id}`.
4. Gate cover actions by resolved permission state:
     - no cover + creator/admin => upload allowed
    - existing cover + creator/admin => replace/delete allowed
    - non-creator/non-admin => read-only cover state
5. Refactor `AddBookPage` manual form to remove unsupported inputs and add missing supported metadata fields.
6. Add `genres`/book type selector sourced from the backend enum.
7. Validate create -> optional cover upload -> add to library flow end-to-end against existing API responses.

### 7.6 Mobile (Expo React Native)
- Implement state transition controls with optional reading date support.
- Implement review submit and review fetch controls for selected `bookId`.
- Render lifecycle/review response payloads for quick verification in development.

### 7.7 Validation
- Web: execute `npm run build` in `web/`.
- Mobile: execute TypeScript validation (`npx tsc --noEmit`) in `mobile/`.

## 8. Resolved Decisions Before Coding

- Popup inline editing will target the backend-supported metadata slice through `PUT /books/{id}`.
- "Tipo de libro" maps directly to backend `genres`.
- Frontend UX will use single-select for `genres` in this iteration, even though the backend supports multiple values.
- `otherAuthors` is included in the first iteration of the manual creation form.
- Creator users can replace/delete their own covers; admins can always do so.
