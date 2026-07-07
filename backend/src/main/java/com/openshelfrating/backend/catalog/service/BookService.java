package com.openshelfrating.backend.catalog.service;

import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.auth.domain.UserRole;
import com.openshelfrating.backend.auth.repository.UserAccountRepository;
import com.openshelfrating.backend.catalog.api.BookResponse;
import com.openshelfrating.backend.catalog.api.BookSearchResponse;
import com.openshelfrating.backend.catalog.api.BookStatsResponse;
import com.openshelfrating.backend.catalog.api.BooksPagedResponse;
import com.openshelfrating.backend.catalog.api.CreateBookRequest;
import com.openshelfrating.backend.catalog.api.UpdateBookRequest;
import com.openshelfrating.backend.catalog.config.CatalogProperties;
import com.openshelfrating.backend.catalog.domain.Book;
import com.openshelfrating.backend.catalog.domain.BookDeduplicationKey;
import com.openshelfrating.backend.catalog.domain.BookDeduplicationKeyType;
import com.openshelfrating.backend.catalog.domain.BookGenre;
import com.openshelfrating.backend.catalog.repository.BookDeduplicationKeyRepository;
import com.openshelfrating.backend.catalog.repository.BookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final BookDeduplicationKeyRepository deduplicationKeyRepository;
    private final UserAccountRepository userAccountRepository;
    private final IsbnValidator isbnValidator;
    private final TitleAuthorNormalizer normalizer;
    private final CatalogProperties catalogProperties;

    public BookService(
            BookRepository bookRepository,
            BookDeduplicationKeyRepository deduplicationKeyRepository,
            UserAccountRepository userAccountRepository,
            IsbnValidator isbnValidator,
            TitleAuthorNormalizer normalizer,
            CatalogProperties catalogProperties
    ) {
        this.bookRepository = bookRepository;
        this.deduplicationKeyRepository = deduplicationKeyRepository;
        this.userAccountRepository = userAccountRepository;
        this.isbnValidator = isbnValidator;
        this.normalizer = normalizer;
        this.catalogProperties = catalogProperties;
    }

    public BookResponse createBook(CreateBookRequest request, UUID actorUserId) {
        UserAccount actor = getUser(actorUserId);

        String isbn13 = isbnValidator.normalizeIsbn(request.isbn13());
        String isbn10 = isbnValidator.normalizeIsbn(request.isbn10());

        if (catalogProperties.isIsbnValidationStrict()) {
            isbnValidator.validateIsbn13(isbn13);
            isbnValidator.validateIsbn10(isbn10);
        }

        if (isbn13 != null) {
            Book existingByIsbn = bookRepository.findByIsbn13(isbn13).orElse(null);
            if (existingByIsbn != null) {
                return toBookResponse(existingByIsbn, true);
            }
        }

        String normalizedTitleAuthor = normalizer.buildTitleAuthorKey(request.title(), request.primaryAuthor());
        Book existingByTitleAuthor = bookRepository.findByNormalizedTitleAuthor(normalizedTitleAuthor).orElse(null);
        if (existingByTitleAuthor != null) {
            return toBookResponse(existingByTitleAuthor, true);
        }

        Book book = new Book();
        book.setTitle(request.title().trim());
        book.setPrimaryAuthor(request.primaryAuthor().trim());
        book.setNormalizedTitleAuthor(normalizedTitleAuthor);
        book.setIsbn13(isbn13);
        book.setIsbn10(isbn10);
        book.setPublisher(trimToNull(request.publisher()));
        book.setPublicationDate(request.publicationDate());
        book.setPages(request.pages());
        book.setLanguage(trimToNull(request.language()) == null ? "en" : request.language().trim());
        book.setCoverUrl(trimToNull(request.coverUrl()));
        book.setCreatedBy(actor);
        book.setCanonical(true);

        if (request.otherAuthors() != null) {
            List<String> authors = request.otherAuthors().stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .distinct()
                    .toList();
            book.setOtherAuthors(authors);
        }

        if (request.genres() != null) {
            book.setGenres(request.genres());
        }

        book = bookRepository.save(book);

        if (isbn13 != null) {
            recordDeduplicationKey(book, isbn13, BookDeduplicationKeyType.ISBN13);
        }
        recordDeduplicationKey(book, normalizedTitleAuthor, BookDeduplicationKeyType.TITLE_AUTHOR);

        return toBookResponse(book, false);
    }

    @Transactional(readOnly = true)
    public BookResponse getBook(UUID bookId) {
        Book book = getBookOrThrow(bookId);
        return toBookResponse(book, true);
    }

    public BookResponse updateBook(UUID bookId, UpdateBookRequest request, UUID actorUserId) {
        Book book = getBookOrThrow(bookId);
        authorizeCreatorOrAdmin(book, actorUserId);

        String nextTitle = request.title() != null ? requireNonBlank(request.title(), "title") : book.getTitle();
        String nextPrimaryAuthor = request.primaryAuthor() != null
                ? requireNonBlank(request.primaryAuthor(), "primaryAuthor")
                : book.getPrimaryAuthor();
        String nextNormalizedTitleAuthor = normalizer.buildTitleAuthorKey(nextTitle, nextPrimaryAuthor);
        String nextIsbn13 = request.isbn13() != null ? isbnValidator.normalizeIsbn(request.isbn13()) : book.getIsbn13();
        String nextIsbn10 = request.isbn10() != null ? isbnValidator.normalizeIsbn(request.isbn10()) : book.getIsbn10();

        if (catalogProperties.isIsbnValidationStrict()) {
            isbnValidator.validateIsbn13(nextIsbn13);
            isbnValidator.validateIsbn10(nextIsbn10);
        }

        Book existingByIsbn = nextIsbn13 == null ? null : bookRepository.findByIsbn13(nextIsbn13).orElse(null);
        if (existingByIsbn != null && !existingByIsbn.getId().equals(book.getId())) {
            throw new CatalogException(HttpStatus.CONFLICT, "Another book already exists with the same ISBN-13");
        }

        Book existingByTitleAuthor = bookRepository.findByNormalizedTitleAuthor(nextNormalizedTitleAuthor).orElse(null);
        if (existingByTitleAuthor != null && !existingByTitleAuthor.getId().equals(book.getId())) {
            throw new CatalogException(HttpStatus.CONFLICT, "Another book already exists with the same title and primary author");
        }

        book.setTitle(nextTitle);
        book.setPrimaryAuthor(nextPrimaryAuthor);
        book.setNormalizedTitleAuthor(nextNormalizedTitleAuthor);
        book.setIsbn13(nextIsbn13);
        book.setIsbn10(nextIsbn10);

        if (request.otherAuthors() != null) {
            List<String> authors = request.otherAuthors().stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .distinct()
                    .toList();
            book.setOtherAuthors(new ArrayList<>(authors));
        }

        if (request.coverUrl() != null) {
            book.setCoverUrl(trimToNull(request.coverUrl()));
        }
        if (request.genres() != null) {
            book.setGenres(request.genres());
        }
        if (request.publisher() != null) {
            book.setPublisher(trimToNull(request.publisher()));
        }
        if (request.publicationDate() != null) {
            book.setPublicationDate(request.publicationDate());
        }
        if (request.pages() != null) {
            book.setPages(request.pages());
        }
        if (request.language() != null) {
            book.setLanguage(requireNonBlank(request.language(), "language"));
        }

        book = bookRepository.save(book);
        return toBookResponse(book, false);
    }

    @Transactional(readOnly = true)
    public BooksPagedResponse searchBooks(String query, int page, int size) {
        int sanitizedPage = Math.max(page, 0);
        int maxPageSize = Math.max(catalogProperties.getSearchMaxPageSize(), 1);
        int sanitizedSize = Math.max(1, Math.min(size, maxPageSize));

        Pageable pageable = PageRequest.of(sanitizedPage, sanitizedSize);
        String rawQuery = query == null ? "" : query.trim();
        String normalizedExactQuery = isbnValidator.normalizeIsbn(rawQuery);

        Page<Book> resultPage = rawQuery.isBlank()
                ? bookRepository.findAllByCanonicalTrue(pageable)
                : bookRepository.searchCanonical(rawQuery, normalizedExactQuery == null ? rawQuery : normalizedExactQuery, pageable);

        List<BookSearchResponse> books = resultPage.getContent().stream()
                .map(this::toBookSearchResponse)
                .toList();

        return new BooksPagedResponse(books, resultPage.getNumber(), resultPage.getSize(), resultPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public BookStatsResponse getStats() {
        long totalBooks = bookRepository.countByCanonicalTrue();

        Map<String, Long> byLanguage = new LinkedHashMap<>();
        for (Object[] row : bookRepository.countCanonicalByLanguage()) {
            byLanguage.put((String) row[0], (Long) row[1]);
        }

        Map<String, Long> byGenre = new LinkedHashMap<>();
        for (Object[] row : bookRepository.countCanonicalByGenre()) {
            BookGenre genre = (BookGenre) row[0];
            byGenre.put(genre.name(), (Long) row[1]);
        }

        return new BookStatsResponse(totalBooks, byGenre, byLanguage);
    }

    public void markAsCanonical(UUID canonicalBookId, UUID duplicateBookId, UUID actorUserId) {
        requireAdmin(actorUserId);

        if (canonicalBookId.equals(duplicateBookId)) {
            throw new CatalogException(HttpStatus.BAD_REQUEST, "Canonical and duplicate book must be different");
        }

        Book canonical = getBookOrThrow(canonicalBookId);
        Book duplicate = getBookOrThrow(duplicateBookId);

        canonical.setCanonical(true);
        duplicate.setCanonical(false);

        bookRepository.save(canonical);
        bookRepository.save(duplicate);
    }

    private void recordDeduplicationKey(Book book, String key, BookDeduplicationKeyType type) {
        BookDeduplicationKey deduplicationKey = new BookDeduplicationKey();
        deduplicationKey.setBook(book);
        deduplicationKey.setDedupKey(key);
        deduplicationKey.setType(type);
        deduplicationKeyRepository.save(deduplicationKey);
    }

    private UserAccount getUser(UUID userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new CatalogException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void requireAdmin(UUID userId) {
        UserAccount user = getUser(userId);
        if (user.getRole() != UserRole.ADMIN) {
            throw new CatalogException(HttpStatus.FORBIDDEN, "Admin role is required for this operation");
        }
    }

    private void authorizeCreatorOrAdmin(Book book, UUID userId) {
        UserAccount user = getUser(userId);
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        boolean isCreator = book.getCreatedBy() != null && book.getCreatedBy().getId().equals(user.getId());
        if (!isAdmin && !isCreator) {
            throw new CatalogException(HttpStatus.FORBIDDEN, "Only the creator or an admin can update this book");
        }
    }

    private Book getBookOrThrow(UUID bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new CatalogException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    private BookResponse toBookResponse(Book book, boolean isExisting) {
        return new BookResponse(
                book.getId(),
                book.getTitle(),
                book.getPrimaryAuthor(),
                book.getOtherAuthors(),
                book.getIsbn13(),
                book.getIsbn10(),
                book.getPublisher(),
                book.getPublicationDate(),
                book.getPages(),
                book.getLanguage(),
                book.getGenres(),
                book.getCoverUrl(),
                book.getCreatedBy().getId(),
                book.isCanonical(),
                book.getCreatedAt(),
                book.getUpdatedAt(),
                isExisting
        );
    }

    private BookSearchResponse toBookSearchResponse(Book book) {
        return new BookSearchResponse(book.getId(), book.getTitle(), book.getPrimaryAuthor(), book.getCoverUrl(), book.getCreatedBy().getId());
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String requireNonBlank(String value, String fieldName) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new CatalogException(HttpStatus.BAD_REQUEST, fieldName + " must not be blank");
        }
        return trimmed;
    }
}
