package com.openshelfrating.backend.library.service;

import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.auth.domain.UserRole;
import com.openshelfrating.backend.auth.repository.UserAccountRepository;
import com.openshelfrating.backend.catalog.api.BookSearchResponse;
import com.openshelfrating.backend.catalog.domain.Book;
import com.openshelfrating.backend.library.api.ReviewRequest;
import com.openshelfrating.backend.library.api.UserBookReviewResponse;
import com.openshelfrating.backend.library.domain.ReadingState;
import com.openshelfrating.backend.library.domain.UserBook;
import com.openshelfrating.backend.library.repository.UserBookRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@Transactional
public class LibraryReviewService {

    private final UserBookRepository userBookRepository;
    private final UserAccountRepository userAccountRepository;

    public LibraryReviewService(UserBookRepository userBookRepository, UserAccountRepository userAccountRepository) {
        this.userBookRepository = userBookRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public UserBookReviewResponse submitReview(UUID pathUserId, UUID principalUserId, UUID bookId, ReviewRequest request) {
        authorizeAccess(pathUserId, principalUserId);

        UserBook userBook = userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(pathUserId, bookId)
                .orElseThrow(() -> new LibraryException(HttpStatus.NOT_FOUND, "Book not found in user library"));

        if (userBook.getReadingState() != ReadingState.READ) {
            throw new LibraryException(HttpStatus.BAD_REQUEST, "Review can only be submitted when reading state is READ");
        }

        userBook.setRating(request.rating());
        userBook.setOpinion(request.opinion());
        userBook.setReviewUpdatedAt(OffsetDateTime.now());
        userBook = userBookRepository.save(userBook);

        return toResponse(userBook);
    }

    @Transactional(readOnly = true)
    public UserBookReviewResponse getReview(UUID pathUserId, UUID principalUserId, UUID bookId) {
        authorizeAccess(pathUserId, principalUserId);

        UserBook userBook = userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(pathUserId, bookId)
                .orElseThrow(() -> new LibraryException(HttpStatus.NOT_FOUND, "Book not found in user library"));

        return toResponse(userBook);
    }

    private void authorizeAccess(UUID pathUserId, UUID principalUserId) {
        UUID effectivePrincipal = principalUserId != null ? principalUserId : pathUserId;

        UserAccount requester = userAccountRepository.findById(effectivePrincipal)
                .orElseThrow(() -> new LibraryException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));

        boolean owner = requester.getId().equals(pathUserId);
        boolean admin = requester.getRole() == UserRole.ADMIN;
        if (!owner && !admin) {
            throw new LibraryException(HttpStatus.FORBIDDEN, "Only owner or admin can access this library");
        }
    }

    private UserBookReviewResponse toResponse(UserBook userBook) {
        Book book = userBook.getBook();
        BookSearchResponse bookResponse = new BookSearchResponse(
                book.getId(),
                book.getTitle(),
                book.getPrimaryAuthor(),
                book.getCoverUrl()
        );

        return new UserBookReviewResponse(
                userBook.getId(),
                bookResponse,
                userBook.getReadingState(),
                userBook.getAddedAt(),
                userBook.getStartedReadingAt(),
                userBook.getCompletedReadingAt(),
                userBook.getRating(),
                userBook.getOpinion(),
                userBook.getReviewUpdatedAt()
        );
    }
}
