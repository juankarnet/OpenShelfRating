package com.openshelfrating.backend.catalog.api;

import com.openshelfrating.backend.catalog.service.BookService;
import com.openshelfrating.backend.catalog.service.UnifiedBookSearchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/books")
public class BookController {

    private final BookService bookService;
    private final UnifiedBookSearchService unifiedBookSearchService;

    public BookController(BookService bookService, UnifiedBookSearchService unifiedBookSearchService) {
        this.bookService = bookService;
        this.unifiedBookSearchService = unifiedBookSearchService;
    }

    @PostMapping
    public ResponseEntity<BookResponse> createBook(
            @Valid @RequestBody CreateBookRequest request,
            @RequestParam("actorUserId") UUID actorUserId
    ) {
        BookResponse response = bookService.createBook(request, actorUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/search")
    public BooksPagedResponse searchBooks(
            @RequestParam(name = "q", required = false, defaultValue = "") String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        return bookService.searchBooks(query, page, size);
    }

    @PostMapping("/search-unified")
    public UnifiedSearchResponse searchUnified(
            @Valid @RequestBody UnifiedSearchRequest request,
            @RequestParam("actorUserId") UUID actorUserId
    ) {
        return unifiedBookSearchService.searchUnified(request.query(), actorUserId, request.limit());
    }

    @PostMapping("/search-unified/add")
    public ResponseEntity<AddFromSearchResponse> addFromSearchResult(
            @Valid @RequestBody AddFromSearchRequest request,
            @RequestParam("actorUserId") UUID actorUserId
    ) {
        AddFromSearchResponse response = unifiedBookSearchService.addFromSearchResult(request, actorUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/stats")
    public BookStatsResponse getStats() {
        return bookService.getStats();
    }

    @GetMapping("/{id}")
    public BookResponse getBook(@PathVariable("id") UUID bookId) {
        return bookService.getBook(bookId);
    }

    @GetMapping("/{id}/deletion-eligibility")
    public BookDeletionEligibilityResponse getDeletionEligibility(
            @PathVariable("id") UUID bookId,
            @RequestParam("actorUserId") UUID actorUserId
    ) {
        return bookService.getDeletionEligibility(bookId, actorUserId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(
            @PathVariable("id") UUID bookId,
            @RequestParam("actorUserId") UUID actorUserId
    ) {
        bookService.deleteBookFromCatalog(bookId, actorUserId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public BookResponse updateBook(
            @PathVariable("id") UUID bookId,
            @Valid @RequestBody UpdateBookRequest request,
            @RequestParam("actorUserId") UUID actorUserId
    ) {
        return bookService.updateBook(bookId, request, actorUserId);
    }

    @PatchMapping("/{id}/mark-canonical")
    public ResponseEntity<Void> markCanonical(
            @PathVariable("id") UUID canonicalBookId,
            @RequestParam("duplicateBookId") UUID duplicateBookId,
            @RequestParam("actorUserId") UUID actorUserId
    ) {
        bookService.markAsCanonical(canonicalBookId, duplicateBookId, actorUserId);
        return ResponseEntity.noContent().build();
    }
}
