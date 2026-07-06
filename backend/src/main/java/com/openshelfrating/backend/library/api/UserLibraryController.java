package com.openshelfrating.backend.library.api;

import com.openshelfrating.backend.library.domain.ReadingState;
import com.openshelfrating.backend.library.service.UserLibraryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/users/{userId}/library")
public class UserLibraryController {

    private final UserLibraryService userLibraryService;

    public UserLibraryController(UserLibraryService userLibraryService) {
        this.userLibraryService = userLibraryService;
    }

    @PostMapping
    public ResponseEntity<UserBookResponse> addBook(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UUID principalUserId,
            @Valid @RequestBody AddToLibraryRequest request
    ) {
        UserBookResponse response = userLibraryService.addBookToLibrary(userId, principalUserId, request.bookId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> removeBook(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UUID principalUserId,
            @PathVariable UUID bookId
    ) {
        userLibraryService.removeBookFromLibrary(userId, principalUserId, bookId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<UserBookResponse>> listLibrary(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UUID principalUserId,
            @RequestParam(required = false) ReadingState state,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<UserBookResponse> response = userLibraryService.listUserLibrary(
                userId,
                principalUserId,
                state,
                includeDeleted,
                q,
                page,
                size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public UserLibraryStatsResponse getStats(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UUID principalUserId
    ) {
        return userLibraryService.getLibraryStats(userId, principalUserId);
    }

    @PutMapping("/{userBookId}/state")
    public ResponseEntity<UserBookResponse> transitionReadingState(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UUID principalUserId,
            @PathVariable UUID userBookId,
            @Valid @RequestBody TransitionReadingStateRequest request
    ) {
        UserBookResponse response = userLibraryService.transitionReadingState(
                userId,
                principalUserId,
                userBookId,
                request.nextState(),
                request.readDate()
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userBookId}/review")
    public ResponseEntity<UserBookResponse> updateReview(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UUID principalUserId,
            @PathVariable UUID userBookId,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        UserBookResponse response = userLibraryService.updateReview(
                userId,
                principalUserId,
                userBookId,
                request.rating(),
                request.opinion()
        );
        return ResponseEntity.ok(response);
    }
}
