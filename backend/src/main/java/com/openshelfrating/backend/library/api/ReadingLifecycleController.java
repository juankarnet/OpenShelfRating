package com.openshelfrating.backend.library.api;

import com.openshelfrating.backend.library.service.LibraryReviewService;
import com.openshelfrating.backend.library.service.ReadingLifecycleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/users/{userId}/library/{bookId}")
public class ReadingLifecycleController {

    private final ReadingLifecycleService readingLifecycleService;
    private final LibraryReviewService libraryReviewService;

    public ReadingLifecycleController(
            ReadingLifecycleService readingLifecycleService,
            LibraryReviewService libraryReviewService
    ) {
        this.readingLifecycleService = readingLifecycleService;
        this.libraryReviewService = libraryReviewService;
    }

    @PatchMapping("/state")
    public ResponseEntity<UserBookResponse> updateState(
            @PathVariable UUID userId,
            @PathVariable UUID bookId,
            @AuthenticationPrincipal UUID principalUserId,
            @Valid @RequestBody UpdateReadingStateRequest request
    ) {
        UserBookResponse response = readingLifecycleService.updateReadingState(
                userId,
                principalUserId,
                bookId,
                request.newState(),
                request.readingDate()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/review")
    public ResponseEntity<UserBookReviewResponse> submitReview(
            @PathVariable UUID userId,
            @PathVariable UUID bookId,
            @AuthenticationPrincipal UUID principalUserId,
            @Valid @RequestBody ReviewRequest request
    ) {
        UserBookReviewResponse response = libraryReviewService.submitReview(userId, principalUserId, bookId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<UserBookReviewResponse> getReview(
            @PathVariable UUID userId,
            @PathVariable UUID bookId,
            @AuthenticationPrincipal UUID principalUserId
    ) {
        return ResponseEntity.ok(libraryReviewService.getReview(userId, principalUserId, bookId));
    }
}
