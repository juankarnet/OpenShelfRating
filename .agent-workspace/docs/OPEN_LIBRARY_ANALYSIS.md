# Open Library API Analysis

## 1. API Endpoints & Response Structure

### 1.1 Búsqueda por ISBN
**Endpoint:** `GET https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&format=json&jscmd=data`

**Ejemplo:** `https://openlibrary.org/api/books?bibkeys=ISBN:9788437604947&format=json&jscmd=data`

**Response Structure:**
```json
{
  "ISBN:9788437604947": {
    "publishers": [
      {
        "name": "Minotauro"
      }
    ],
    "title": "El señor de los anillos",
    "url": "https://openlibrary.org/works/OL45883W",
    "identifiers": {
      "openlibrary": ["OL45883W"],
      "isbn_10": ["8437604945"],
      "isbn_13": ["9788437604947"]
    },
    "classifiers": {
      "subjects": ["Fantasy fiction"],
      "ebook_count": 5
    },
    "authors": [
      {
        "url": "https://openlibrary.org/authors/OL26320A",
        "name": "J. R. R. Tolkien"
      }
    ],
    "publish_date": "2012",
    "number_of_pages": 1136,
    "excerpts": [],
    "cover_url": "https://covers.openlibrary.org/b/id/...-M.jpg",
    "cover_id": 12345678,
    "isbn": "9788437604947",
    "language": ["eng"],
    "edition_key": ["OL45883W"]
  }
}
```

### 1.2 Búsqueda por Título
**Endpoint:** `GET https://openlibrary.org/search.json?title={titulo}`

**Ejemplo:** `https://openlibrary.org/search.json?title=el+señor+de+los+anillos`

**Response Structure:**
```json
{
  "numFound": 250,
  "start": 0,
  "docs": [
    {
      "key": "/works/OL45883W",
      "title": "El señor de los anillos",
      "author_name": ["J. R. R. Tolkien"],
      "author_key": ["OL26320A"],
      "first_publish_year": 2012,
      "isbn": ["9788437604947"],
      "subject": ["Fantasy", "Fiction"],
      "language": ["eng"],
      "has_fulltext": false,
      "edition_count": 15,
      "first_edition_key": "OL12345678M",
      "public_scan_b64": "...",
      "publish_year": [2012],
      "cover_edition_key": "OL12345678M",
      "cover_i": 12345678
    }
  ]
}
```

### 1.3 Búsqueda Avanzada
**Endpoint:** `GET https://openlibrary.org/search.json?{query_params}`

**Supported Params:**
- `title={title}` — búsqueda por título
- `author={author}` — búsqueda por autor
- `isbn={isbn}` — búsqueda por ISBN (equivalente a `/api/books`)
- `limit={n}` — max 100 (default 10)
- `offset={n}` — paginación

---

## 2. Data Mapping: Open Library → OpenShelfRating Model

### 2.1 ISBN Search Response → Book Entity

| Open Library Field | OSR Book Field | Type | Handling |
|---|---|---|---|
| `identifiers.isbn_13[0]` | `isbn13` | String | Direct map, validate checksum |
| `identifiers.isbn_10[0]` | `isbn10` | String | Direct map, validate checksum |
| `title` | `title` | String | Normalize & trim |
| `authors[].name` (first) | `primaryAuthor` | String | Primary author |
| `authors[].name` (rest) | `otherAuthors` | List<String> | JSON array |
| `publishers[0].name` | `publisher` | String | Direct map |
| `publish_date` | `publicationDate` | LocalDate | Parse YYYY-MM-DD format |
| `number_of_pages` | `pages` | Integer | Direct map |
| `language[0]` (ISO 639-1) | `language` | String | Convert if needed (e.g., eng→en) |
| `classifiers.subjects` | `genres` | Set<BookGenre> | Map subjects to enums (FANTASY→FANTASY) |
| `cover_url` | **null** (user downloads later) | String | Do NOT auto-download; user triggers upload |

### 2.2 Title Search Response → Book Entity

| Open Library Field | OSR Book Field | Type | Handling |
|---|---|---|---|
| `isbn[0]` | `isbn13` | String | Direct map, validate checksum |
| `title` | `title` | String | Normalize & trim |
| `author_name[0]` | `primaryAuthor` | String | First author |
| `author_name` (rest) | `otherAuthors` | List<String> | JSON array |
| `publish_year[0]` | `publicationDate` | LocalDate | Year only; set to Jan 1 |
| `subject` | `genres` | Set<BookGenre> | Map subjects to enums |
| **NOT PROVIDED** | `pages` | Integer | **Missing; mark for completion** |
| **NOT PROVIDED** | `publisher` | String | **Missing; mark for completion** |
| **NOT PROVIDED** | `language` | String | **Default to "en"; mark for completion** |

**Note:** Title search provides less detail; use ISBN search as fallback if ISBN present.

---

## 3. Challenges & Solutions

### 3.1 Genre Mapping Challenge
**Problem:** Open Library subjects are free-form strings; OSR uses enum `BookGenre`.

**Solution:**
- Create mapping table: `SUBJECT_TO_GENRE_MAPPING`
- Common mappings: "Fantasy fiction" → FANTASY, "Mystery" → MYSTERY, etc.
- Unknown subjects → log warning, skip genre assignment (allow empty set)
- Maintainable via admin interface (Phase 2)

### 3.2 Language Code Handling
**Problem:** Open Library uses ISO 639-3 (eng); OSR uses ISO 639-1 (en).

**Solution:**
- Maintain language code converter map or use library like `commons-lang3`
- Example: eng → en, spa → es, fra → fr
- Default to "en" if conversion fails

### 3.3 Missing Fields in Title Search
**Problem:** Title search lacks publisher, pages, detailed language.

**Solution:**
- Mark incomplete books with `metadataCompletionStatus = INCOMPLETE`
- Add `completionNotes` field (free text)
- Create admin UI to batch-fetch missing data via ISBN lookup
- When user adds incomplete book, frontend shows banner: "Book info incomplete; admin will complete"

### 3.4 Deduplication After External Import
**Problem:** Multiple users may add same Open Library book simultaneously; could race-condition create duplicates.

**Solution:**
- ISBN-13 unique constraint at DB level (UNIQUE NOT NULL or partial unique)
- Transaction isolation: SERIALIZABLE for book creation
- Fallback: if duplicate detected on INSERT, reuse existing book_id (or catch & retry)

### 3.5 Cover Image Strategy
**Problem:** Open Library provides `cover_url`; storing that external URL directly would keep the catalog dependent on a third-party asset.

**Solution:**
- Return `cover_url` in unified search results
- When user confirms "Add book" and a new catalog record is created, backend attempts to download the image immediately
- Persist the downloaded image through SPEC-0005 storage and save the internal media path as the final cover reference
- If the download fails, the book import still succeeds and the cover can be replaced later

### 3.6 Rate Limiting
**Problem:** Open Library has rate limits (~1 req/s per IP).

**Solution:**
- Implement `@Retryable(maxAttempts=3, delay=1000ms)` via Spring Retry
- Cache results for 24h (Redis or Caffeine)
- Graceful fallback: if Open Library unavailable, search only local DB

---

## 4. Request/Response Flow for New Unified Search API

### 4.1 Frontend → Backend
**Request:**
```json
POST /books/search-unified
{
  "query": "9788437604947",  // can be ISBN, title, or author
  "limit": 10
}
```

### 4.2 Backend Logic

1. **Identify query type:**
   - `isIsbn(query)` → ISBN format?
   - Otherwise → text query

2. **If ISBN:**
   - Query local DB by ISBN-13
   - If found → return with `source: "LOCAL"`, `status: "EXISTS_IN_SYSTEM"`
   - If not found → call Open Library API
     - Parse response → map to Book DTO
     - Return with `source: "OPEN_LIBRARY"`, `status: "AVAILABLE_FOR_IMPORT"`

3. **If Text (title/author):**
   - Query local DB: `searchByTitle(query)` + `searchByAuthor(query)` (fuzzy, top 10)
   - If found locally → return results with `source: "LOCAL"`, `status: "EXISTS_IN_SYSTEM"`
   - If not found locally → call Open Library `search.json?title=query`
     - Parse response → map to Book DTOs
     - Return with `source: "OPEN_LIBRARY"`, `status: "AVAILABLE_FOR_IMPORT"`

### 4.3 Backend Response
```json
{
  "results": [
    {
      "bookId": "uuid-or-null",
      "title": "El señor de los anillos",
      "primaryAuthor": "J. R. R. Tolkien",
      "isbn13": "9788437604947",
      "publisher": "Minotauro",
      "publicationDate": "2012-01-01",
      "pages": 1136,
      "language": "es",
      "genres": ["FANTASY"],
      "coverUrl": "https://covers.openlibrary.org/...",
      "source": "OPEN_LIBRARY",
      "status": "AVAILABLE_FOR_IMPORT",  // or "EXISTS_IN_SYSTEM" or "EXISTS_IN_USER_LIBRARY"
      "metadataCompletionStatus": "COMPLETE"  // or "INCOMPLETE"
    }
  ],
  "count": 1,
  "query": "9788437604947",
  "searchedSources": ["LOCAL_DB", "OPEN_LIBRARY"]
}
```

### 4.4 User Actions
- If `status: "EXISTS_IN_USER_LIBRARY"` → show "Already in your library" (disable button)
- If `status: "EXISTS_IN_SYSTEM"` → show "Add to library" (enable button)
- If `status: "AVAILABLE_FOR_IMPORT"` → show "Add to system & library" (enable button with warning)

---

## 5. Implementation Notes

1. **Query Type Detector:**
   ```java
   private SearchQueryType detectQueryType(String query) {
       if (isIsbn(query)) return SearchQueryType.ISBN;
       return SearchQueryType.TEXT;
   }
   
   private boolean isIsbn(String query) {
       String normalized = query.replaceAll("[^0-9X]", "");
       return (normalized.length() == 10 || normalized.length() == 13);
   }
   ```

2. **Open Library Client:**
   - Use Spring `RestTemplate` or `WebClient`
   - Implement cache with TTL 24h
   - Implement retry logic for transient failures

3. **Fuzzy Matching:**
   - Use PostgreSQL `ILIKE` for substring search
   - Use `FuzzyWuzzy` library (or similar) for fuzzy scoring if needed
   - Limit results to top 10

4. **Database Additions:**
   - Add `metadataCompletionStatus` column to `books` table (enum: COMPLETE, INCOMPLETE)
   - Add `completionNotes` text column for notes (nullable)
   - Add `externalSourceId` (e.g., Open Library work/edition key) for audit trail

