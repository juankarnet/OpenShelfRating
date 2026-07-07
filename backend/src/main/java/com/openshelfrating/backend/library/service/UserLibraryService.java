package com.openshelfrating.backend.library.service;

import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.auth.domain.UserRole;
import com.openshelfrating.backend.auth.repository.UserAccountRepository;
import com.openshelfrating.backend.catalog.api.BookSearchResponse;
import com.openshelfrating.backend.catalog.domain.Book;
import com.openshelfrating.backend.catalog.repository.BookRepository;
import com.openshelfrating.backend.library.api.UserBookResponse;
import com.openshelfrating.backend.library.api.UserLibraryStatsResponse;
import com.openshelfrating.backend.library.domain.ReadingState;
import com.openshelfrating.backend.library.domain.UserBook;
import com.openshelfrating.backend.library.repository.UserBookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UserLibraryService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserBookRepository userBookRepository;
    private final UserAccountRepository userAccountRepository;
    private final BookRepository bookRepository;

    public UserLibraryService(
            UserBookRepository userBookRepository,
            UserAccountRepository userAccountRepository,
            BookRepository bookRepository
    ) {
        this.userBookRepository = userBookRepository;
        this.userAccountRepository = userAccountRepository;
        this.bookRepository = bookRepository;
    }

    public UserBookResponse addBookToLibrary(UUID pathUserId, UUID principalUserId, UUID bookId) {
        authorizeAccess(pathUserId, principalUserId);

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new LibraryException(HttpStatus.NOT_FOUND, "Book not found"));

        userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(pathUserId, bookId)
                .ifPresent(existing -> {
                    throw new LibraryException(HttpStatus.CONFLICT, "Book already exists in user library");
                });

        UserBook reactivated = userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNotNull(pathUserId, bookId)
                .orElse(null);

        if (reactivated != null) {
            reactivated.setDeletedAt(null);
            reactivated.setReadingState(ReadingState.PENDING);
            reactivated.setStartedReadingAt(null);
            reactivated.setCompletedReadingAt(null);
            reactivated.setRating(null);
            reactivated.setOpinion(null);
            reactivated.setReviewUpdatedAt(null);
            reactivated.setAddedAt(OffsetDateTime.now());
            reactivated = userBookRepository.save(reactivated);
            return toResponse(reactivated);
        }

        UserAccount user = userAccountRepository.findById(pathUserId)
                .orElseThrow(() -> new LibraryException(HttpStatus.NOT_FOUND, "User not found"));

        UserBook userBook = new UserBook();
        userBook.setUser(user);
        userBook.setBook(book);
        userBook.setReadingState(ReadingState.PENDING);
        userBook = userBookRepository.save(userBook);

        return toResponse(userBook);
    }

    public void removeBookFromLibrary(UUID pathUserId, UUID principalUserId, UUID bookId) {
        authorizeAccess(pathUserId, principalUserId);

        UserBook activeEntry = userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(pathUserId, bookId)
                .orElseThrow(() -> new LibraryException(HttpStatus.NOT_FOUND, "Book not found in user library"));

        activeEntry.setDeletedAt(OffsetDateTime.now());
        userBookRepository.save(activeEntry);
    }

    @Transactional(readOnly = true)
    public Page<UserBookResponse> listUserLibrary(
            UUID pathUserId,
            UUID principalUserId,
            ReadingState state,
            boolean includeDeleted,
            String searchQuery,
            int page,
            int size
    ) {
        authorizeAccess(pathUserId, principalUserId);

        int normalizedPage = Math.max(0, page);
        int normalizedSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);

        String query = searchQuery == null ? "" : searchQuery.trim();
        Page<UserBook> result;

        if (!query.isBlank()) {
            result = includeDeleted
                    ? userBookRepository.searchAllByUser(pathUserId, query, pageable)
                    : userBookRepository.searchActiveByUser(pathUserId, query, pageable);
        } else if (state != null) {
            result = includeDeleted
                    ? userBookRepository.findByUserIdAndReadingState(pathUserId, state, pageable)
                    : userBookRepository.findByUserIdAndReadingStateAndDeletedAtIsNull(pathUserId, state, pageable);
        } else {
            result = includeDeleted
                    ? userBookRepository.findByUserId(pathUserId, pageable)
                    : userBookRepository.findByUserIdAndDeletedAtIsNull(pathUserId, pageable);
        }

        List<UserBookResponse> mapped = result.getContent().stream().map(this::toResponse).toList();
        return new PageImpl<>(mapped, pageable, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public UserLibraryStatsResponse getLibraryStats(UUID pathUserId, UUID principalUserId) {
        authorizeAccess(pathUserId, principalUserId);

        long totalBooks = userBookRepository.countByUserIdAndDeletedAtIsNull(pathUserId);
        long pendingCount = userBookRepository.countByUserIdAndReadingStateAndDeletedAtIsNull(pathUserId, ReadingState.PENDING);
        long readingCount = userBookRepository.countByUserIdAndReadingStateAndDeletedAtIsNull(pathUserId, ReadingState.READING);
        long readCount = userBookRepository.countByUserIdAndReadingStateAndDeletedAtIsNull(pathUserId, ReadingState.READ);

        // Calculate average rating of books that have been rated
        double averageRating = userBookRepository.findAllByUserIdAndDeletedAtIsNull(pathUserId).stream()
                .filter(userBook -> userBook.getRating() != null)
                .mapToInt(userBook -> userBook.getRating())
                .average()
                .orElse(0.0);

        var stateDistribution = new UserLibraryStatsResponse.StateDistribution(
                pendingCount,
                readingCount,
                readCount
        );

        return new UserLibraryStatsResponse(totalBooks, stateDistribution, averageRating);
    }

    public UserBookResponse transitionReadingState(
            UUID pathUserId,
            UUID principalUserId,
            UUID userBookId,
            ReadingState nextState,
            String readDateStr
    ) {
        authorizeAccess(pathUserId, principalUserId);

        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new LibraryException(HttpStatus.NOT_FOUND, "Book not found in user library"));

        if (!userBook.getUser().getId().equals(pathUserId)) {
            throw new LibraryException(HttpStatus.FORBIDDEN, "Cannot modify another user's library");
        }

        // Validate state transition
        ReadingState currentState = userBook.getReadingState();
        if (!isValidStateTransition(currentState, nextState)) {
            throw new LibraryException(HttpStatus.BAD_REQUEST, "Invalid state transition");
        }

        userBook.setReadingState(nextState);

        // Set timestamps based on state
        OffsetDateTime now = OffsetDateTime.now();
        if (nextState == ReadingState.READING) {
            userBook.setStartedReadingAt(now);
        } else if (nextState == ReadingState.READ) {
            if (readDateStr != null && !readDateStr.isBlank()) {
                try {
                    LocalDate readDate = LocalDate.parse(readDateStr);
                    userBook.setCompletedReadingAt(readDate.atStartOfDay().atOffset(OffsetDateTime.now().getOffset()));
                } catch (Exception e) {
                    userBook.setCompletedReadingAt(now);
                }
            } else {
                userBook.setCompletedReadingAt(now);
            }
        }

        userBook = userBookRepository.save(userBook);
        return toResponse(userBook);
    }

    public UserBookResponse updateReview(
            UUID pathUserId,
            UUID principalUserId,
            UUID userBookId,
            Integer rating,
            String opinion
    ) {
        authorizeAccess(pathUserId, principalUserId);

        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new LibraryException(HttpStatus.NOT_FOUND, "Book not found in user library"));

        if (!userBook.getUser().getId().equals(pathUserId)) {
            throw new LibraryException(HttpStatus.FORBIDDEN, "Cannot modify another user's library");
        }

        if (userBook.getReadingState() != ReadingState.READ) {
            throw new LibraryException(HttpStatus.BAD_REQUEST, "Can only rate books that have been read");
        }

        userBook.setRating(rating);
        userBook.setOpinion(opinion);
        userBook.setReviewUpdatedAt(OffsetDateTime.now());

        userBook = userBookRepository.save(userBook);
        return toResponse(userBook);
    }

    private boolean isValidStateTransition(ReadingState from, ReadingState to) {
        switch (from) {
            case PENDING:
                return to == ReadingState.READING || to == ReadingState.PENDING;
            case READING:
                return to == ReadingState.READ || to == ReadingState.PENDING;
            case READ:
                return to == ReadingState.READING || to == ReadingState.PENDING;
            default:
                return false;
        }
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

    private UserBookResponse toResponse(UserBook userBook) {
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
