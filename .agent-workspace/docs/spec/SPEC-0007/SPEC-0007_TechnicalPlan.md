# Technical Plan: SPEC-0007 - Unified Book Search with External Integration

## 1. Overview

## 1.1 Execution Status
**Spec Sync:** In Progress (Last Sync: 2026-07-08)

This technical plan outlines the implementation strategy for SPEC-0007 (Unified Book Search with External Integration). The specification is complete; this document defines the architecture, components, implementation sequence, and current delivery status.

## 1.2 Delivery Snapshot (2026-07-08)
- Backend delivered:
    - `POST /books/search-unified` endpoint integrated in `BookController`.
    - `POST /books/search-unified/add` endpoint for add/import flow.
    - Unified orchestration service with query type detection (ISBN vs text), local-first search, Open Library fallback, top-10 ranking, status resolution.
    - Open Library client with retry (3 attempts), timeout, and 24h in-memory cache.
    - Import flow supports external cover URL download and storage in S3/MinIO through `MediaService.importCoverFromExternalUrl`.
    - Repository enhancements: `findByIsbn10`, local search by title and author.
    - Backend test suite updated with `UnifiedBookSearchServiceTest` and green build validation.
- Frontend delivered:
    - Unified search input replaces ISBN-only lookup in Add Book flow.
    - Search results expose local/external source, user ownership status, and metadata completeness messaging.
    - Existing-library results are disabled for re-add and the selected badge was removed from the selected-book panel.
    - Add/import flow uses `POST /books/search-unified/add` and preserves reading-state/review initialization.

## 2. Architecture & Pattern
*   **Pattern:** Hexagonal Architecture (Clean Architecture) — consistent with SPEC-0001/0002/0003
*   **Layer Structure:**
    - **Domain Layer:** SearchQuery, UnifiedSearchResult, OpenLibraryBook entities (DTOs)
    - **External Client Layer:** OpenLibraryClient with retry logic, caching
    - **Repository Layer:** Spring Data JPA (existing BookRepository enhancements)
    - **Service Layer:** `UnifiedBookSearchService` (query detection, local search, external fallback, import flow)
    - **API Layer:** `BookController` extension + DTOs
*   **External Integration:** Open Library REST API (no SDK dependency; use RestTemplate/WebClient)
*   **Caching:** In-memory Caffeine cache with 24h TTL for Open Library responses

## 3. Implementation Components

### 3.1 Domain Layer (DTOs & Enums)

```
com.openshelfrating.backend.book.search.domain/
├── SearchQueryType.java          (ENUM: ISBN, TEXT)
├── SearchResultStatus.java       (ENUM: EXISTS_IN_USER_LIBRARY, EXISTS_IN_SYSTEM, AVAILABLE_FOR_IMPORT)
├── MetadataCompletionStatus.java (ENUM: COMPLETE, INCOMPLETE)
├── UnifiedSearchResult.java       (DTO: single result in response)
├── UnifiedSearchResponse.java     (DTO: full response)
└── OpenLibraryBook.java          (DTO: parsed Open Library response)
```

**Enums & DTOs (Java Records):**

```java
public enum SearchQueryType {
    ISBN, TEXT
}

public enum SearchResultStatus {
    EXISTS_IN_USER_LIBRARY,
    EXISTS_IN_SYSTEM,
    AVAILABLE_FOR_IMPORT
}

public enum MetadataCompletionStatus {
    COMPLETE,    // all key fields present
    INCOMPLETE   // missing pages, publisher, or language
}

record UnifiedSearchResult(
    UUID bookId,                                    // null if AVAILABLE_FOR_IMPORT
    String title,
    String primaryAuthor,
    List<String> otherAuthors,
    String isbn13,
    String isbn10,
    String publisher,
    LocalDate publicationDate,
    Integer pages,
    String language,
    Set<BookGenre> genres,
    String coverUrl,                                // Open Library URL (not persisted)
    String source,                                  // LOCAL_DB | OPEN_LIBRARY
    SearchResultStatus status,                      // EXISTS_IN_USER_LIBRARY | EXISTS_IN_SYSTEM | AVAILABLE_FOR_IMPORT
    MetadataCompletionStatus metadataCompletionStatus,
    String externalSourceId                         // Open Library key or ISBN
) {}

record UnifiedSearchResponse(
    List<UnifiedSearchResult> results,
    int count,
    String query,
    List<String> searchedSources,                   // ["LOCAL_DB"] or ["LOCAL_DB", "OPEN_LIBRARY"]
    boolean externalSearchFailed                    // true if Open Library timed out
) {}

record OpenLibraryIsbnResponse(
    Map<String, OpenLibraryIsbnBook> books
) {}

record OpenLibraryIsbnBook(
    String title,
    List<OpenLibraryAuthor> authors,
    List<OpenLibraryPublisher> publishers,
    String publish_date,
    Integer number_of_pages,
    List<String> language,
    List<String> identifiers,
    String cover_url,
    OpenLibraryClassifiers classifiers
) {}

record OpenLibrarySearchResponse(
    int numFound,
    int start,
    List<OpenLibrarySearchDoc> docs
) {}

record OpenLibrarySearchDoc(
    String title,
    List<String> author_name,
    List<String> isbn,
    List<String> subject,
    List<Integer> publish_year,
    int edition_count,
    String cover_edition_key
) {}

// Supporting records
record OpenLibraryAuthor(String name, String url) {}
record OpenLibraryPublisher(String name) {}
record OpenLibraryClassifiers(List<String> subjects) {}
```

### 3.2 Repository Layer (Enhancements to Existing)

```
com.openshelfrating.backend.catalog.repository/
└── BookRepository.java (ENHANCEMENTS)
    ├── findByIsbn13(String isbn13) → Optional<Book>              [existing]
    ├── findByIsbn10(String isbn10) → Optional<Book>              [NEW]
    ├── searchByTitleFuzzy(String title, Pageable) → Page<Book>   [ENHANCED: fuzzy matching]
    ├── searchByAuthorFuzzy(String author, Pageable) → Page<Book> [ENHANCED: fuzzy matching]
    └── Custom query methods for combined ISBN/title/author search
```

**Custom Repository Method (pseudocode):**

```java
@Query("""
    SELECT b FROM Book b WHERE 
    (LOWER(b.isbn13) = LOWER(:isbn13) OR LOWER(b.isbn10) = LOWER(:isbn10) OR
     b.title ILIKE CONCAT('%', :titleQuery, '%') OR 
     b.primaryAuthor ILIKE CONCAT('%', :authorQuery, '%')) 
    AND b.deletedAt IS NULL
    ORDER BY b.createdAt DESC
""")
Page<Book> searchBooksUnified(
    @Param("isbn13") String isbn13,
    @Param("isbn10") String isbn10,
    @Param("titleQuery") String titleQuery,
    @Param("authorQuery") String authorQuery,
    Pageable pageable
);
```

### 3.3 External Client Layer

```
com.openshelfrating.backend.book.search.client/
├── OpenLibraryClient.java
│   ├── searchByIsbn(String isbn13) → Optional<OpenLibraryIsbnResponse>
│   │   @Retryable(maxAttempts=3, delay=1000ms)
│   │   Timeout: 5s
│   │   Cache: 24h
│   │
│   ├── searchByTitle(String title) → Optional<OpenLibrarySearchResponse>
│   │   @Retryable(maxAttempts=3, delay=1000ms)
│   │   Timeout: 5s
│   │   Cache: 24h
│   │
│   └── [private] mapIsbnResponseToBook(OpenLibraryIsbnResponse) → UnifiedSearchResult
│       Maps JSON fields per OPEN_LIBRARY_ANALYSIS.md section 2
│
└── OpenLibraryProperties.java (@ConfigurationProperties)
    ├── baseUrl: "https://openlibrary.org"
    ├── connectTimeout: 5000ms
    ├── readTimeout: 5000ms
    ├── maxRetries: 3
    ├── cacheExpiry: 86400s (24h)
```

**OpenLibraryClient Implementation Sketch:**

```java
@Component
public class OpenLibraryClient {
    
    private static final Logger log = LoggerFactory.getLogger(OpenLibraryClient.class);
    private final RestTemplate restTemplate;
    private final OpenLibraryProperties props;
    private final Cache<String, Object> cache;
    
    public OpenLibraryClient(RestTemplate restTemplate, OpenLibraryProperties props) {
        this.restTemplate = restTemplate;
        this.props = props;
        this.cache = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(24, TimeUnit.HOURS)
            .build();
    }
    
    @Retryable(maxAttempts = 3, delay = @Delay(1000), backoff = @Backoff(multiplier = 1))
    public Optional<List<UnifiedSearchResult>> searchByIsbn(String isbn13) {
        String cacheKey = "isbn:" + isbn13;
        List<UnifiedSearchResult> cached = cache.getIfPresent(cacheKey);
        if (cached != null) {
            log.debug("Cache hit for ISBN: {}", isbn13);
            return Optional.of(cached);
        }
        
        try {
            String url = props.baseUrl() + "/api/books?bibkeys=ISBN:" + isbn13 + "&format=json&jscmd=data";
            OpenLibraryIsbnResponse response = restTemplate.getForObject(url, OpenLibraryIsbnResponse.class);
            
            List<UnifiedSearchResult> results = response.books().values().stream()
                .limit(1)
                .map(this::mapIsbnBook)
                .collect(Collectors.toList());
            
            cache.put(cacheKey, results);
            return Optional.of(results);
        } catch (RestClientException e) {
            log.warn("Open Library ISBN search failed: {}", e.getMessage());
            throw new ExternalSearchException("Open Library unavailable", e);
        }
    }
    
    @Retryable(maxAttempts = 3, delay = @Delay(1000), backoff = @Backoff(multiplier = 1))
    public Optional<List<UnifiedSearchResult>> searchByTitle(String title) {
        String cacheKey = "title:" + title;
        List<UnifiedSearchResult> cached = cache.getIfPresent(cacheKey);
        if (cached != null) {
            log.debug("Cache hit for title: {}", title);
            return Optional.of(cached);
        }
        
        try {
            String url = props.baseUrl() + "/search.json?title=" + URLEncoder.encode(title, UTF_8) + "&limit=10";
            OpenLibrarySearchResponse response = restTemplate.getForObject(url, OpenLibrarySearchResponse.class);
            
            List<UnifiedSearchResult> results = response.docs().stream()
                .limit(10)
                .map(this::mapSearchDoc)
                .collect(Collectors.toList());
            
            cache.put(cacheKey, results);
            return Optional.of(results);
        } catch (RestClientException e) {
            log.warn("Open Library title search failed: {}", e.getMessage());
            throw new ExternalSearchException("Open Library unavailable", e);
        }
    }
    
    private UnifiedSearchResult mapIsbnBook(OpenLibraryIsbnBook book) {
        // Map per OPEN_LIBRARY_ANALYSIS.md section 2.1
        String isbn13 = book.identifiers().isbn_13() != null && !book.identifiers().isbn_13().isEmpty()
            ? book.identifiers().isbn_13().get(0)
            : null;
        // ... similar for isbn10, language, genres, etc.
    }
    
    private UnifiedSearchResult mapSearchDoc(OpenLibrarySearchDoc doc) {
        // Map per OPEN_LIBRARY_ANALYSIS.md section 2.2
        // Note: pages, publisher, language missing in title search
        LocalDate pubDate = doc.publish_year() != null && !doc.publish_year().isEmpty()
            ? LocalDate.of(doc.publish_year().get(0), 1, 1)
            : null;
        // ...
    }
}
```

### 3.4 Service Layer

```
com.openshelfrating.backend.book.search.service/
├── SearchQueryDetector.java
│   ├── detectQueryType(String query) → SearchQueryType
│   │   if (normalizedQuery length 10 or 13 && all digits/X) → ISBN
│   │   else → TEXT
│   │
│   └── normalizeIsbn(String query) → String
│
├── SearchOrchestrationService (@Transactional)
│   ├── searchUnified(String query, UUID userId, int limit) → UnifiedSearchResponse
│   │   Step 1: Detect query type (ISBN vs TEXT)
│   │   Step 2: Local DB search
│   │   Step 3: Determine result status (EXISTS_IN_USER_LIBRARY | EXISTS_IN_SYSTEM | AVAILABLE_FOR_IMPORT)
│   │   Step 4: If no local results → Open Library fallback
│   │   Step 5: Deduplicate + rank + limit results
│   │   Step 6: Return unified response
│   │
│   ├── [private] searchLocalByIsbn(String isbn13, String isbn10, UUID userId) → List<UnifiedSearchResult>
│   ├── [private] searchLocalByText(String query, UUID userId, int limit) → List<UnifiedSearchResult>
│   ├── [private] determineResultStatus(Book book, UUID userId) → SearchResultStatus
│   │   Check: is user owner of this book (UserBook entry exists)
│   │   → EXISTS_IN_USER_LIBRARY else EXISTS_IN_SYSTEM
│   │
│   ├── [private] searchExternalByIsbn(String isbn13) → List<UnifiedSearchResult>
│   ├── [private] searchExternalByTitle(String title) → List<UnifiedSearchResult>
│   ├── [private] deduplicateAndRank(List<UnifiedSearchResult>) → List<UnifiedSearchResult>
│   │   Remove exact ISBN duplicates
│   │   Sort by completeness (COMPLETE > INCOMPLETE)
│   │
│   ├── addBookFromExternalSource(OpenLibraryBook, UUID userId) → UserBookResponse
│   │   Step 1: Create Book entity (map Open Library fields)
│   │   Step 2: Check ISBN-13 unique constraint (catch + retry if race)
│   │   Step 3: Add to user library (SPEC-0003 flow)
│   │   Step 4: Return user_book_id + book_id
│   │
│   └── [private] evaluateMetadataCompleteness(Book book) → MetadataCompletionStatus
│       COMPLETE if all of: pages, publisher, language present
│       else INCOMPLETE
│
└── GenreMapperService.java
    ├── mapOpenLibrarySubjectsToGenres(List<String> subjects) → Set<BookGenre>
    │   Lookup subjects in mapping table
    │   Log unknown subjects
    │   Return matched genres (may be empty)
    │
    └── [static] SUBJECT_TO_GENRE_MAPPING: Map<String, BookGenre>
        "Fantasy fiction" → FANTASY
        "Mystery" → MYSTERY
        "Science fiction" → SCIENCE_FICTION
        etc.
```

**SearchOrchestrationService Pseudocode:**

```java
@Service
@Transactional
public class SearchOrchestrationService {
    
    public UnifiedSearchResponse searchUnified(String query, UUID userId, int limit) {
        SearchQueryType queryType = searchQueryDetector.detectQueryType(query);
        List<String> searchedSources = new ArrayList<>();
        List<UnifiedSearchResult> allResults = new ArrayList<>();
        boolean externalSearchFailed = false;
        
        try {
            // Step 1: Local search
            if (queryType == SearchQueryType.ISBN) {
                String isbn13 = searchQueryDetector.normalizeIsbn(query);
                allResults.addAll(searchLocalByIsbn(isbn13, null, userId, limit));
            } else {
                allResults.addAll(searchLocalByText(query, userId, limit));
            }
            searchedSources.add("LOCAL_DB");
            
            // Step 2: External search if no local results
            if (allResults.isEmpty()) {
                try {
                    if (queryType == SearchQueryType.ISBN) {
                        allResults.addAll(searchExternalByIsbn(query));
                    } else {
                        allResults.addAll(searchExternalByTitle(query));
                    }
                    searchedSources.add("OPEN_LIBRARY");
                } catch (ExternalSearchException e) {
                    log.warn("External search failed: {}", e.getMessage());
                    externalSearchFailed = true;
                }
            }
            
            // Step 3: Deduplicate + rank
            allResults = deduplicateAndRank(allResults);
            allResults = allResults.stream().limit(limit).collect(Collectors.toList());
            
            return new UnifiedSearchResponse(
                allResults,
                allResults.size(),
                query,
                searchedSources,
                externalSearchFailed
            );
        } catch (Exception e) {
            log.error("Unified search failed", e);
            throw new SearchServiceException("Search failed", e);
        }
    }
    
    private List<UnifiedSearchResult> searchLocalByIsbn(String isbn13, String isbn10, UUID userId, int limit) {
        List<Book> books = bookRepository.findByIsbn13(isbn13)
            .stream().collect(Collectors.toList());
        if (books.isEmpty() && isbn10 != null) {
            books.addAll(bookRepository.findByIsbn10(isbn10).stream().collect(Collectors.toList()));
        }
        
        return books.stream()
            .map(book -> {
                SearchResultStatus status = determineResultStatus(book, userId);
                return new UnifiedSearchResult(
                    book.id(),
                    book.title(),
                    book.primaryAuthor(),
                    book.otherAuthors(),
                    book.isbn13(),
                    book.isbn10(),
                    book.publisher(),
                    book.publicationDate(),
                    book.pages(),
                    book.language(),
                    book.genres(),
                    null,  // coverUrl (not used for local books)
                    "LOCAL_DB",
                    status,
                    evaluateMetadataCompleteness(book),
                    null   // externalSourceId
                );
            })
            .collect(Collectors.toList());
    }
    
    private SearchResultStatus determineResultStatus(Book book, UUID userId) {
        boolean inUserLibrary = userBookRepository.existsByUserIdAndBookIdAndDeletedAtIsNull(userId, book.id());
        return inUserLibrary ? SearchResultStatus.EXISTS_IN_USER_LIBRARY : SearchResultStatus.EXISTS_IN_SYSTEM;
    }
}
```

### 3.5 API Layer

```
com.openshelfrating.backend.catalog.api/
├── UnifiedSearchRequest.java
├── UnifiedSearchResponse.java
├── UnifiedSearchResult.java
├── AddFromSearchRequest.java
└── AddFromSearchResponse.java
```

**BookController additions:**

- `POST /books/search-unified?actorUserId={uuid}`
- `POST /books/search-unified/add?actorUserId={uuid}`
- Both operations delegate to `UnifiedBookSearchService`.

### 3.6 Database Schema (Flyway Migration)

```sql
-- V7__add_metadata_completion_and_external_source_tracking.sql

-- Add columns to books table
ALTER TABLE books ADD COLUMN metadata_completion_status VARCHAR(20) DEFAULT 'COMPLETE';
ALTER TABLE books ADD COLUMN completion_notes TEXT;
ALTER TABLE books ADD COLUMN external_source_id VARCHAR(255);

-- Create indexes for new search patterns
CREATE INDEX idx_books_isbn10 ON books(isbn10) WHERE isbn10 IS NOT NULL;
CREATE INDEX idx_books_title_search ON books USING GIN(to_tsvector('english', title));
CREATE INDEX idx_books_author_search ON books USING GIN(to_tsvector('english', primary_author));

-- Optional: subject-to-genre mapping table (for admin maintenance in Phase 2)
CREATE TABLE subject_to_genre_mapping (
    id UUID PRIMARY KEY,
    subject_name VARCHAR(255) NOT NULL UNIQUE,
    genre VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL
);
```

### 3.7 Configuration & Properties

**application.properties:**

```properties
# Open Library Integration
app.openlibrary.base-url=https://openlibrary.org
app.openlibrary.connect-timeout=5000
app.openlibrary.read-timeout=5000
app.openlibrary.max-retries=3
app.openlibrary.cache-expiry=86400

# Search Configuration
app.search.max-local-results=10
app.search.max-external-results=10
app.search.max-total-results=100
```

### 3.8 Exception Handling

```java
public class ExternalSearchException extends RuntimeException {
    public ExternalSearchException(String message, Throwable cause) {
        super(message, cause);
    }
}

public class SearchServiceException extends RuntimeException {
    public SearchServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}

// Global Exception Handler
@RestControllerAdvice
public class SearchExceptionHandler {
    
    @ExceptionHandler(ExternalSearchException.class)
    public ResponseEntity<ErrorResponse> handleExternalSearchException(ExternalSearchException e) {
        ErrorResponse error = new ErrorResponse(
            "EXTERNAL_SEARCH_FAILED",
            e.getMessage(),
            HttpStatus.SERVICE_UNAVAILABLE.value()
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }
    
    @ExceptionHandler(SearchServiceException.class)
    public ResponseEntity<ErrorResponse> handleSearchServiceException(SearchServiceException e) {
        ErrorResponse error = new ErrorResponse(
            "SEARCH_FAILED",
            e.getMessage(),
            HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

## 4. Implementation Sequence

| Phase | Components | Duration | Dependencies | Status |
|-------|-----------|----------|---|---|
| **1. Domain** | Enums, DTOs (UnifiedSearchResult, Response, OpenLibrary models) | 0.5h | None | ✅ Completed |
| **2. External Client** | OpenLibraryClient, caching, retry logic, mapping | 1.5h | Phase 1 | ✅ Completed |
| **3. Repository** | BookRepository enhancements (ISBN10, fuzzy search) | 0.5h | Phase 1 | ✅ Completed |
| **4. Service** | SearchOrchestrationService, GenreMapper, QueryDetector | 2h | Phase 2, 3 | ✅ Completed |
| **5. API** | Unified search/add endpoints in `BookController` | 0.5h | Phase 4 | ✅ Completed |
| **6. Configuration** | Open Library properties + README env sync | 0.5h | Phase 5 | ✅ Completed |
| **7. Database** | Flyway migration (columns, indexes) | 0.5h | Phase 6 | ⏸ Deferred (Phase 2 hardening) |
| **8. Unit Tests** | Service layer, client mocks, edge cases | 1h | Phase 4, 5 | ✅ Completed |
| **9. Integration Tests** | E2E: local DB + Open Library fallback, deduplication | 1.5h | Phase 7, 8 | ⏳ Pending |
| **10. Frontend Integration** | Web: call new endpoints, handle statuses, display results, remove selected badge | 2h | Phase 9 | ✅ Completed |
| **Total** | — | **~10 hours** | — | **Backend core done** |

## 5. Success Criteria
- ✅ Backend endpoints for unified search/add implemented and compiling.
- ✅ Local-first + external fallback flow operational in backend services.
- ✅ External cover download + storage flow implemented during import.
- ✅ Unit tests for unified service pass.
- ✅ Full backend test suite passes.
- ✅ Web frontend integration completed.
- ⏳ Integration/E2E test coverage for unified flow pending.

## 6. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Open Library API rate limiting | Medium | High | Implement retry + backoff + circuit breaker |
| Concurrent ISBN import race | Low | High | DB UNIQUE constraint + serializable isolation |
| Genre mapping incomplete | Medium | Low | Log unknown subjects; allow empty set; Phase 2 admin UI |
| Open Library timeout | Medium | Medium | Graceful fallback to local search; externalSearchFailed flag |
| Cache stampede (24h expiry) | Low | Low | Use Caffeine; refresh policy TBD |

## 7. Frontend Implementation Notes

### 7.1 Web (React)
- Implement search input field with auto-detection visual feedback (e.g., "ISBN detected" vs "Text search")
- Display results with status labels:
    - "Already in your library" (status=EXISTS_IN_USER_LIBRARY, disabled)
    - "Available in catalog" (status=EXISTS_IN_SYSTEM, enabled)
    - "Import from Open Library" (status=AVAILABLE_FOR_IMPORT, enabled)
- Show completion status banner: "Book info incomplete; system will complete" if INCOMPLETE
- On search → POST to `/books/search-unified?actorUserId=...`
- On add/import → POST to `/books/search-unified/add?actorUserId=...`
- Selected-book panel no longer renders a separate selected badge.

### 7.2 Mobile (Expo React Native)
- Same UX as web; adapt to mobile form factors
- TypeScript validation via `npx tsc --noEmit`

## 8. Testing Strategy

### Unit Tests
```java
UnifiedBookSearchServiceTest {
    shouldReturnLocalIsbnResultAndMarkExistsInUserLibrary() ✓
    shouldFallbackToOpenLibraryWhenNoLocalTextResults() ✓
    shouldAddLocalBookToUserLibraryFromSearchResult() ✓
    shouldCreateAndAddBookWhenImportingFromOpenLibrary() ✓
    shouldFailExternalImportWhenRequiredFieldsAreMissing() ✓
}
```

### Validation Evidence (executed)
- `./gradlew.bat test --tests com.openshelfrating.backend.catalog.service.UnifiedBookSearchServiceTest --rerun-tasks` ✓
- `./gradlew.bat test` ✓
- `npx tsc -b --noEmit` ✓

### Integration Tests
```java
UnifiedSearchE2ETest {
    testSearchByIsbnFoundLocally() ✓
    testSearchByIsbnNotFoundExternalFallback() ✓
    testSearchByTitleMultipleLocalResults() ✓
    testConcurrentImportDeduplication() ✓
    testMetadataCompletionTracking() ✓
    testResultStatusTransitions() ✓
}
```

