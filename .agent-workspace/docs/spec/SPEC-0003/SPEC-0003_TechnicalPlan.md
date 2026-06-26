# Technical Plan: SPEC-0003 - Personal Library Management

## 1. Overview
This technical plan outlines the implementation strategy for SPEC-0003 (Personal Library Management). Status: **Draft**, updated with clarified decisions and ready for implementation design.

## 2. Architecture & Pattern
*   **Pattern:** Hexagonal Architecture — consistent with SPEC-0001/0002
*   **Key Relationship:** User (1) ←→ (*) UserBook ←→ (1) Book

## 3. Implementation Components

### 3.1 Domain Layer

```
com.openshelfrating.backend.library.domain/
├── UserBook.java              (JPA Entity, PK: id UUID)
├── ReadingState.java          (Enum: PENDING, READING, READ)
└── UserBookStats.java         (DTO for stats aggregation)
```

**UserBook Entity:**
- `id` (UUID PK)
- `user` (FK to UserAccount)
- `book` (FK to Book)
- `readingState` (ENUM: PENDING, READING, READ)
- `addedAt` (TIMESTAMPTZ)
- `startedReadingAt` (TIMESTAMPTZ, nullable)
- `completedReadingAt` (TIMESTAMPTZ, nullable)
- `deletedAt` (TIMESTAMPTZ, nullable — soft delete)

**Active Entry Uniqueness:** enforce one active row per `(user_id, book_id)` with PostgreSQL partial unique index (`WHERE deleted_at IS NULL`).

### 3.2 Repository Layer

```
com.openshelfrating.backend.library.repository/
├── UserBookRepository
│   ├── findByUserIdAndBookId(UUID, UUID) → Optional<UserBook>
│   ├── findByUserIdAndBookIdAndDeletedAtIsNull(UUID, UUID) → Optional<UserBook>
│   ├── findByUserIdAndBookIdAndDeletedAtIsNotNull(UUID, UUID) → Optional<UserBook>
│   ├── findByUserId(UUID, Pageable) → Page<UserBook>
│   ├── findByUserIdAndReadingStateAndDeletedAtIsNull(UUID, ReadingState, Pageable) → Page<UserBook>
│   ├── findByUserIdAndDeletedAtNull(UUID, Pageable) → Page<UserBook>
│   ├── findByUserId(UUID, Pageable) [includeDeleted=true] → Page<UserBook>
│   ├── countByUserIdAndReadingState(UUID, ReadingState) → long
│   ├── existsByUserIdAndBookIdAndDeletedAtIsNull(UUID, UUID) → boolean
│   └── searchByUserIdAndBookTitleOrAuthor(UUID, String, Pageable) → Page<UserBook>
```

### 3.3 Service Layer

```
com.openshelfrating.backend.library.service/
├── UserLibraryService (@Transactional)
│   ├── addBookToLibrary(UUID userId, UUID bookId) → UserBookResponse
│   │   Re-activate soft-deleted record if exists; do not create duplicate
│   ├── removeBookFromLibrary(UUID userId, UUID bookId) → void
│   ├── listUserLibrary(UUID userId, Pageable, ReadingState filter, boolean includeDeleted) → Page<UserBookResponse>
│   ├── searchUserLibrary(UUID userId, String query, Pageable) → Page<UserBookResponse>
│   ├── getLibraryStats(UUID userId) → UserLibraryStatsResponse
│   └── updateReadingState(...) → deferred to SPEC-0004
```

### 3.4 API Layer

**DTOs:**
```java
record AddToLibraryRequest(UUID bookId) {}

record UserBookResponse(
    UUID userBookId,
    BookSearchResponse book,
    ReadingState readingState,
    LocalDateTime addedAt,
    LocalDateTime startedReadingAt,
    LocalDateTime completedReadingAt
) {}

record UserLibraryStatsResponse(
    long totalBooks,
    long pendingCount,
    long readingCount,
    long readCount
) {}
```

**Controller:**
```java
@RestController
@RequestMapping("/users/{userId}/library")
public class UserLibraryController {
    @PostMapping
    public ResponseEntity<UserBookResponse> addBook(
        @PathVariable UUID userId,
        @AuthenticationPrincipal UUID principalUserId,
        @Valid @RequestBody AddToLibraryRequest request
    ) { /* 201 Created, 200 Reactivated, or 409 Conflict */ }
    
    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> removeBook(
        @PathVariable UUID userId,
        @AuthenticationPrincipal UUID principalUserId,
        @PathVariable UUID bookId
    ) { /* 204 No Content */ }
    
    @GetMapping
    public ResponseEntity<Page<UserBookResponse>> listLibrary(
        @PathVariable UUID userId,
        @AuthenticationPrincipal UUID principalUserId,
        @RequestParam(required = false) ReadingState state,
        @RequestParam(defaultValue = "false") boolean includeDeleted,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) { /* 200 OK */ }
    
    @GetMapping("/search")
    public ResponseEntity<Page<UserBookResponse>> searchLibrary(
        @PathVariable UUID userId,
        @AuthenticationPrincipal UUID principalUserId,
        @RequestParam String q
    ) { /* 200 OK */ }
    
    @GetMapping("/stats")
    public ResponseEntity<UserLibraryStatsResponse> getStats(
        @PathVariable UUID userId,
        @AuthenticationPrincipal UUID principalUserId
    ) { /* 200 OK */ }
}
```

### 3.5 Database Schema

**Flyway V3 Migration:** `V3__create_user_library_tables.sql`

```sql
CREATE TABLE user_books (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    reading_state VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    added_at TIMESTAMPTZ NOT NULL,
    started_reading_at TIMESTAMPTZ,
    completed_reading_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_user_books_active_user_book
    ON user_books(user_id, book_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_user_books_user_id ON user_books(user_id, deleted_at);
CREATE INDEX idx_user_books_state ON user_books(user_id, reading_state, deleted_at);
```

## 4. Implementation Sequence

| Phase | Components | Duration |
|-------|-----------|----------|
| **1. Domain** | UserBook entity, ReadingState enum | 0.5h |
| **2. Repository** | UserBookRepository with queries | 0.5h |
| **3. Service** | UserLibraryService | 1h |
| **4. API** | UserLibraryController, DTOs | 0.5h |
| **5. Testing** | Integration tests | 1h |
| **Total** | — | **~3.5 hours** |

## 5. Success Criteria
- ✅ All 8 REQs implemented
- ✅ All 6 ACs pass
- ✅ Unique constraint prevents duplicates
- ✅ Soft delete preserves audit trail
- ✅ NFR-001: List <500ms for 200+ books
- ✅ Integration tests pass

## 6. Frontend Implementation Steps (Web + Mobile)

### 6.1 Web (React)
- Implement personal library listing with filters (`state`, `includeDeleted`, `page`, `size`) via `GET /users/{userId}/library`.
- Implement add-to-library flow via `POST /users/{userId}/library`.
- Implement remove flow via `DELETE /users/{userId}/library/{bookId}` with confirmation.
- Implement stats panel via `GET /users/{userId}/library/stats`.

### 6.2 Mobile (Expo React Native)
- Implement library list screen with state filters and paginated calls.
- Implement add/remove actions bound to API endpoints.
- Implement stats summary block for the current user.

### 6.3 Validation
- Web: execute `npm run build` in `web/`.
- Mobile: execute TypeScript validation (`npx tsc --noEmit`) in `mobile/`.
