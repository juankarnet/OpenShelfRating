package com.openshelfrating.backend.library.service;

import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.auth.domain.UserRole;
import com.openshelfrating.backend.auth.repository.UserAccountRepository;
import com.openshelfrating.backend.catalog.api.BookSearchResponse;
import com.openshelfrating.backend.catalog.domain.Book;
import com.openshelfrating.backend.library.api.UserBookResponse;
import com.openshelfrating.backend.library.domain.ReadingState;
import com.openshelfrating.backend.library.domain.ReadingStateTransition;
import com.openshelfrating.backend.library.domain.UserBook;
import com.openshelfrating.backend.library.repository.ReadingStateTransitionRepository;
import com.openshelfrating.backend.library.repository.UserBookRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@Transactional
public class ReadingLifecycleService {

    private final UserBookRepository userBookRepository;
    private final UserAccountRepository userAccountRepository;
    private final ReadingStateTransitionRepository transitionRepository;

    public ReadingLifecycleService(
            UserBookRepository userBookRepository,
            UserAccountRepository userAccountRepository,
            ReadingStateTransitionRepository transitionRepository
    ) {
        this.userBookRepository = userBookRepository;
        this.userAccountRepository = userAccountRepository;
        this.transitionRepository = transitionRepository;
    }

    public UserBookResponse updateReadingState(
            UUID pathUserId,
            UUID principalUserId,
            UUID bookId,
            ReadingState newState,
            OffsetDateTime requestedReadingDate
    ) {
        authorizeAccess(pathUserId, principalUserId);

        UserBook userBook = userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(pathUserId, bookId)
                .orElseThrow(() -> new LibraryException(HttpStatus.NOT_FOUND, "Book not found in user library"));

        ReadingState currentState = userBook.getReadingState();
        if (!currentState.canTransitionTo(newState)) {
            throw new LibraryException(HttpStatus.BAD_REQUEST, "Invalid state transition");
        }

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime effectiveReadingDate = requestedReadingDate != null ? requestedReadingDate : now;
        if (effectiveReadingDate.isAfter(now)) {
            throw new LibraryException(HttpStatus.BAD_REQUEST, "Reading date cannot be in the future");
        }

        if (newState == ReadingState.READING) {
            userBook.setStartedReadingAt(effectiveReadingDate);
        }

        if (newState == ReadingState.READ) {
            OffsetDateTime startedAt = userBook.getStartedReadingAt();
            if (startedAt != null && effectiveReadingDate.isBefore(startedAt)) {
                throw new LibraryException(HttpStatus.BAD_REQUEST, "Completed date cannot be before started date");
            }
            if (startedAt == null) {
                userBook.setStartedReadingAt(effectiveReadingDate);
            }
            userBook.setCompletedReadingAt(effectiveReadingDate);
        }

        userBook.setReadingState(newState);
        userBook = userBookRepository.save(userBook);

        ReadingStateTransition transition = new ReadingStateTransition();
        transition.setUserBook(userBook);
        transition.setPreviousState(currentState);
        transition.setNewState(newState);
        transition.setTransitionAt(now);
        transitionRepository.save(transition);

        return toUserBookResponse(userBook);
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

    private UserBookResponse toUserBookResponse(UserBook userBook) {
        Book book = userBook.getBook();
        BookSearchResponse bookResponse = new BookSearchResponse(
                book.getId(),
                book.getTitle(),
                book.getPrimaryAuthor(),
                book.getCoverUrl()
        );

        return new UserBookResponse(
                userBook.getId(),
                bookResponse,
                userBook.getReadingState(),
                userBook.getAddedAt(),
                userBook.getStartedReadingAt(),
                userBook.getCompletedReadingAt(),
                userBook.getRating(),
                userBook.getOpinion(),
                userBook.getReviewUpdatedAt(),
                userBook.getDeletedAt()
        );
    }
}
