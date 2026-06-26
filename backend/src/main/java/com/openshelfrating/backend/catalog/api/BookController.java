package com.openshelfrating.backend.catalog.api;

import com.openshelfrating.backend.catalog.service.BookService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    public BookController(BookService bookService) {
        this.bookService = bookService;
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

    @GetMapping("/stats")
    public BookStatsResponse getStats() {
        return bookService.getStats();
    }

    @GetMapping("/{id}")
    public BookResponse getBook(@PathVariable("id") UUID bookId) {
        return bookService.getBook(bookId);
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
