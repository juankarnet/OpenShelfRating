# Technical Plan: SPEC-0003 - Personal Library Management

## 1. Overview
This technical plan outlines the implementation strategy for SPEC-0003 (Personal Library Management). Status: **Draft**, ready for implementation after SPEC-0002 completion.

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

**Unique Constraint:** (user_id, book_id) — prevent duplicate entries

### 3.2 Repository Layer

```
com.openshelfrating.backend.library.repository/
├── UserBookRepository
│   ├── findByUserIdAndBookId(UUID, UUID) → Optional<UserBook>
│   ├── findByUserId(UUID, Pageable) → Page<UserBook>
│   ├── findByUserIdAndReadingState(UUID, ReadingState, Pageable) → Page<UserBook>
│   ├── findByUserIdAndDeletedAtNull(UUID, Pageable) → Page<UserBook>
│   ├── countByUserIdAndReadingState(UUID, ReadingState) → long
│   ├── existsByUserIdAndBookId(UUID, UUID) → boolean
│   └── searchByUserIdAndBookTitleOrAuthor(UUID, String, Pageable) → Page<UserBook>
```

### 3.3 Service Layer

```
com.openshelfrating.backend.library.service/
├── UserLibraryService (@Transactional)
│   ├── addBookToLibrary(UUID userId, UUID bookId) → UserBookResponse
│   ├── removeBookFromLibrary(UUID userId, UUID bookId) → void
│   ├── listUserLibrary(UUID userId, Pageable, ReadingState filter) → Page<UserBookResponse>
│   ├── searchUserLibrary(UUID userId, String query, Pageable) → Page<UserBookResponse>
│   ├── getLibraryStats(UUID userId) → UserLibraryStatsResponse
│   └── updateReadingState(UUID userId, UUID bookId, ReadingState newState) → UserBookResponse
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
        @Valid @RequestBody AddToLibraryRequest request
    ) { /* 201 Created or 409 Conflict */ }
    
    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> removeBook(
        @PathVariable UUID userId,
        @PathVariable UUID bookId
    ) { /* 204 No Content */ }
    
    @GetMapping
    public ResponseEntity<Page<UserBookResponse>> listLibrary(
        @PathVariable UUID userId,
        @RequestParam(required = false) ReadingState state,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) { /* 200 OK */ }
    
    @GetMapping("/search")
    public ResponseEntity<Page<UserBookResponse>> searchLibrary(
        @PathVariable UUID userId,
        @RequestParam String q
    ) { /* 200 OK */ }
    
    @GetMapping("/stats")
    public ResponseEntity<UserLibraryStatsResponse> getStats(
        @PathVariable UUID userId
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
    deleted_at TIMESTAMPTZ,
    UNIQUE(user_id, book_id, deleted_at IS NULL)
);

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
- ✅ All 7 REQs implemented
- ✅ All 5 ACs pass
- ✅ Unique constraint prevents duplicates
- ✅ Soft delete preserves audit trail
- ✅ NFR-001: List <500ms for 200+ books
- ✅ Integration tests pass
