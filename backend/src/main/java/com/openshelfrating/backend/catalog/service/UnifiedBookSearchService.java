package com.openshelfrating.backend.catalog.service;

import com.openshelfrating.backend.catalog.api.AddFromSearchRequest;
import com.openshelfrating.backend.catalog.api.AddFromSearchResponse;
import com.openshelfrating.backend.catalog.api.MetadataCompletionStatus;
import com.openshelfrating.backend.catalog.api.UnifiedSearchResponse;
import com.openshelfrating.backend.catalog.api.UnifiedSearchResult;
import com.openshelfrating.backend.catalog.api.UnifiedSearchSource;
import com.openshelfrating.backend.catalog.api.UnifiedSearchStatus;
import com.openshelfrating.backend.catalog.api.CreateBookRequest;
import com.openshelfrating.backend.catalog.api.BookResponse;
import com.openshelfrating.backend.catalog.domain.Book;
import com.openshelfrating.backend.catalog.domain.BookGenre;
import com.openshelfrating.backend.catalog.repository.BookRepository;
import com.openshelfrating.backend.library.api.UserBookResponse;
import com.openshelfrating.backend.library.repository.UserBookRepository;
import com.openshelfrating.backend.library.service.UserLibraryService;
import com.openshelfrating.backend.media.service.MediaService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class UnifiedBookSearchService {

    private final BookRepository bookRepository;
    private final UserBookRepository userBookRepository;
    private final UserLibraryService userLibraryService;
    private final BookService bookService;
    private final IsbnValidator isbnValidator;
    private final TitleAuthorNormalizer normalizer;
    private final OpenLibraryClient openLibraryClient;
    private final MediaService mediaService;

    public UnifiedBookSearchService(
            BookRepository bookRepository,
            UserBookRepository userBookRepository,
            UserLibraryService userLibraryService,
            BookService bookService,
            IsbnValidator isbnValidator,
            TitleAuthorNormalizer normalizer,
            OpenLibraryClient openLibraryClient,
            MediaService mediaService
    ) {
        this.bookRepository = bookRepository;
        this.userBookRepository = userBookRepository;
        this.userLibraryService = userLibraryService;
        this.bookService = bookService;
        this.isbnValidator = isbnValidator;
        this.normalizer = normalizer;
        this.openLibraryClient = openLibraryClient;
        this.mediaService = mediaService;
    }

    @Transactional(readOnly = true)
    public UnifiedSearchResponse searchUnified(String query, UUID actorUserId, Integer limit) {
        String safeQuery = query == null ? "" : query.trim();
        int safeLimit = Math.max(1, Math.min(limit == null ? 10 : limit, 10));
        List<String> searchedSources = new ArrayList<>();

        if (safeQuery.isBlank()) {
            return new UnifiedSearchResponse(List.of(), 0, safeQuery, searchedSources, false);
        }

        boolean isbnQuery = isIsbnQuery(safeQuery);
        List<UnifiedSearchResult> localResults = isbnQuery
                ? searchLocalByIsbn(safeQuery, actorUserId)
                : searchLocalByText(safeQuery, actorUserId, safeLimit);

        searchedSources.add(UnifiedSearchSource.LOCAL_DB.name());
        if (!localResults.isEmpty()) {
            List<UnifiedSearchResult> rankedLocal = rankAndLimit(localResults, safeLimit);
            return new UnifiedSearchResponse(rankedLocal, rankedLocal.size(), safeQuery, searchedSources, false);
        }

        searchedSources.add(UnifiedSearchSource.OPEN_LIBRARY.name());
        try {
            List<OpenLibraryClient.ExternalBookCandidate> external = isbnQuery
                    ? openLibraryClient.searchByIsbn(isbnValidator.normalizeIsbn(safeQuery))
                    : openLibraryClient.searchByTitle(safeQuery, safeLimit);

            List<UnifiedSearchResult> mappedExternal = external.stream()
                    .map(candidate -> mapExternalCandidate(candidate, actorUserId))
                    .filter(Objects::nonNull)
                    .toList();

            List<UnifiedSearchResult> rankedExternal = rankAndLimit(mappedExternal, safeLimit);
            return new UnifiedSearchResponse(rankedExternal, rankedExternal.size(), safeQuery, searchedSources, false);
        } catch (OpenLibraryClient.OpenLibraryUnavailableException ex) {
            return new UnifiedSearchResponse(List.of(), 0, safeQuery, searchedSources, true);
        }
    }

    public AddFromSearchResponse addFromSearchResult(AddFromSearchRequest request, UUID actorUserId) {
        if (request.source() == UnifiedSearchSource.LOCAL_DB) {
            if (request.bookId() == null) {
                throw new CatalogException(HttpStatus.BAD_REQUEST, "bookId is required for LOCAL_DB source");
            }

            UserBookResponse userBook = userLibraryService.addBookToLibrary(actorUserId, actorUserId, request.bookId());
            return new AddFromSearchResponse(request.bookId(), userBook.id(), false, UnifiedSearchStatus.EXISTS_IN_SYSTEM);
        }

        if (request.bookId() != null) {
            UserBookResponse userBook = userLibraryService.addBookToLibrary(actorUserId, actorUserId, request.bookId());
            return new AddFromSearchResponse(request.bookId(), userBook.id(), false, UnifiedSearchStatus.EXISTS_IN_SYSTEM);
        }

        String title = trimToNull(request.title());
        String primaryAuthor = trimToNull(request.primaryAuthor());
        if (title == null || primaryAuthor == null) {
            throw new CatalogException(HttpStatus.BAD_REQUEST, "title and primaryAuthor are required for OPEN_LIBRARY imports");
        }

        CreateBookRequest createBookRequest = new CreateBookRequest(
                title,
                primaryAuthor,
                request.otherAuthors(),
                trimToNull(request.isbn13()),
                trimToNull(request.isbn10()),
                trimToNull(request.publisher()),
                request.publicationDate(),
                request.pages(),
                trimToNull(request.language()),
                request.genres(),
                trimToNull(request.coverUrl())
        );

        BookResponse createdOrExisting = bookService.createBook(createBookRequest, actorUserId);
        UserBookResponse userBook = userLibraryService.addBookToLibrary(actorUserId, actorUserId, createdOrExisting.bookId());

        if (!createdOrExisting.existing() && trimToNull(request.coverUrl()) != null) {
            try {
                mediaService.importCoverFromExternalUrl(createdOrExisting.bookId(), actorUserId, request.coverUrl());
            } catch (Exception ignored) {
                // Cover import should not block book creation/addition flow.
            }
        }

        UnifiedSearchStatus status = createdOrExisting.existing()
                ? UnifiedSearchStatus.EXISTS_IN_SYSTEM
                : UnifiedSearchStatus.AVAILABLE_FOR_IMPORT;

        return new AddFromSearchResponse(
                createdOrExisting.bookId(),
                userBook.id(),
                !createdOrExisting.existing(),
                status
        );
    }

    private List<UnifiedSearchResult> searchLocalByIsbn(String rawQuery, UUID actorUserId) {
        String normalized = isbnValidator.normalizeIsbn(rawQuery);
        if (normalized == null) {
            return List.of();
        }

        List<Book> books = new ArrayList<>();
        if (normalized.matches("\\d{13}")) {
            bookRepository.findByIsbn13(normalized).ifPresent(books::add);
        }
        if (normalized.matches("\\d{9}[\\dX]")) {
            bookRepository.findByIsbn10(normalized).ifPresent(book -> {
                if (books.stream().noneMatch(existing -> existing.getId().equals(book.getId()))) {
                    books.add(book);
                }
            });
        }

        return books.stream().map(book -> mapLocalBook(book, actorUserId)).toList();
    }

    private List<UnifiedSearchResult> searchLocalByText(String rawQuery, UUID actorUserId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);

        List<Book> titleMatches = bookRepository.searchCanonicalByTitle(rawQuery, pageable).getContent();
        if (!titleMatches.isEmpty()) {
            return titleMatches.stream().map(book -> mapLocalBook(book, actorUserId)).toList();
        }

        List<Book> authorMatches = bookRepository.searchCanonicalByAuthor(rawQuery, pageable).getContent();
        return authorMatches.stream().map(book -> mapLocalBook(book, actorUserId)).toList();
    }

    private UnifiedSearchResult mapLocalBook(Book book, UUID actorUserId) {
        UnifiedSearchStatus status = isInUserLibrary(actorUserId, book.getId())
                ? UnifiedSearchStatus.EXISTS_IN_USER_LIBRARY
                : UnifiedSearchStatus.EXISTS_IN_SYSTEM;

        return new UnifiedSearchResult(
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
                UnifiedSearchSource.LOCAL_DB,
                status,
                resolveMetadataStatus(book.getPublisher(), book.getPages(), book.getLanguage()),
                null
        );
    }

    private UnifiedSearchResult mapExternalCandidate(OpenLibraryClient.ExternalBookCandidate candidate, UUID actorUserId) {
        if (candidate.title() == null || candidate.primaryAuthor() == null) {
            return null;
        }

        Book existing = findExistingBook(candidate);
        if (existing != null) {
            UnifiedSearchStatus existingStatus = isInUserLibrary(actorUserId, existing.getId())
                    ? UnifiedSearchStatus.EXISTS_IN_USER_LIBRARY
                    : UnifiedSearchStatus.EXISTS_IN_SYSTEM;

            return new UnifiedSearchResult(
                    existing.getId(),
                    existing.getTitle(),
                    existing.getPrimaryAuthor(),
                    existing.getOtherAuthors(),
                    existing.getIsbn13(),
                    existing.getIsbn10(),
                    existing.getPublisher(),
                    existing.getPublicationDate(),
                    existing.getPages(),
                    existing.getLanguage(),
                    existing.getGenres(),
                    existing.getCoverUrl(),
                    UnifiedSearchSource.OPEN_LIBRARY,
                    existingStatus,
                    resolveMetadataStatus(existing.getPublisher(), existing.getPages(), existing.getLanguage()),
                    candidate.externalSourceId()
            );
        }

        String normalizedLanguage = normalizeLanguage(candidate.language());
        Set<BookGenre> genres = mapSubjectsToGenres(candidate.subjects());

        return new UnifiedSearchResult(
                null,
                candidate.title(),
                candidate.primaryAuthor(),
                candidate.otherAuthors(),
                candidate.isbn13(),
                candidate.isbn10(),
                candidate.publisher(),
                candidate.publicationDate(),
                candidate.pages(),
                normalizedLanguage,
                genres,
                candidate.coverUrl(),
                UnifiedSearchSource.OPEN_LIBRARY,
                UnifiedSearchStatus.AVAILABLE_FOR_IMPORT,
                resolveMetadataStatus(candidate.publisher(), candidate.pages(), normalizedLanguage),
                candidate.externalSourceId()
        );
    }

    private List<UnifiedSearchResult> rankAndLimit(List<UnifiedSearchResult> input, int limit) {
        Map<String, UnifiedSearchResult> deduplicated = new HashMap<>();
        for (UnifiedSearchResult result : input) {
            String key = dedupKey(result);
            deduplicated.putIfAbsent(key, result);
        }

        return deduplicated.values().stream()
                .sorted(Comparator.comparing((UnifiedSearchResult value) -> value.metadataCompletionStatus() == MetadataCompletionStatus.INCOMPLETE)
                        .thenComparing(value -> value.title() == null ? "" : value.title().toLowerCase(Locale.ROOT)))
                .limit(limit)
                .toList();
    }

    private String dedupKey(UnifiedSearchResult result) {
        String isbn13 = trimToNull(result.isbn13());
        if (isbn13 != null) {
            return "isbn13:" + isbn13;
        }
        String isbn10 = trimToNull(result.isbn10());
        if (isbn10 != null) {
            return "isbn10:" + isbn10;
        }
        return normalizer.buildTitleAuthorKey(result.title(), result.primaryAuthor());
    }

    private boolean isInUserLibrary(UUID userId, UUID bookId) {
        return userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(userId, bookId).isPresent();
    }

    private boolean isIsbnQuery(String query) {
        String normalized = isbnValidator.normalizeIsbn(query);
        if (normalized == null) {
            return false;
        }
        return normalized.matches("\\d{13}") || normalized.matches("\\d{9}[\\dX]");
    }

    private Book findExistingBook(OpenLibraryClient.ExternalBookCandidate candidate) {
        String isbn13 = trimToNull(candidate.isbn13());
        if (isbn13 != null) {
            Book byIsbn13 = bookRepository.findByIsbn13(isbn13).orElse(null);
            if (byIsbn13 != null) {
                return byIsbn13;
            }
        }

        String isbn10 = trimToNull(candidate.isbn10());
        if (isbn10 != null) {
            Book byIsbn10 = bookRepository.findByIsbn10(isbn10).orElse(null);
            if (byIsbn10 != null) {
                return byIsbn10;
            }
        }

        String normalizedKey = normalizer.buildTitleAuthorKey(candidate.title(), candidate.primaryAuthor());
        return bookRepository.findByNormalizedTitleAuthor(normalizedKey).orElse(null);
    }

    private MetadataCompletionStatus resolveMetadataStatus(String publisher, Integer pages, String language) {
        return trimToNull(publisher) != null && pages != null && trimToNull(language) != null
                ? MetadataCompletionStatus.COMPLETE
                : MetadataCompletionStatus.INCOMPLETE;
    }

    private Set<BookGenre> mapSubjectsToGenres(List<String> subjects) {
        if (subjects == null || subjects.isEmpty()) {
            return Set.of();
        }

        Set<BookGenre> mapped = new HashSet<>();
        for (String subject : subjects) {
            String normalized = subject == null ? "" : subject.toLowerCase(Locale.ROOT);
            if (normalized.contains("fantasy")) {
                mapped.add(BookGenre.FANTASY);
            } else if (normalized.contains("mystery") || normalized.contains("crime")) {
                mapped.add(BookGenre.MYSTERY);
            } else if (normalized.contains("romance")) {
                mapped.add(BookGenre.ROMANCE);
            } else if (normalized.contains("science fiction") || normalized.contains("sci-fi")) {
                mapped.add(BookGenre.SCIENCE_FICTION);
            } else if (normalized.contains("biography")) {
                mapped.add(BookGenre.BIOGRAPHY);
            } else if (normalized.contains("history")) {
                mapped.add(BookGenre.HISTORY);
            } else if (normalized.contains("self-help")) {
                mapped.add(BookGenre.SELF_HELP);
            } else if (normalized.contains("technical") || normalized.contains("programming")) {
                mapped.add(BookGenre.TECHNICAL);
            } else if (normalized.contains("poetry")) {
                mapped.add(BookGenre.POETRY);
            } else if (normalized.contains("drama")) {
                mapped.add(BookGenre.DRAMA);
            } else if (normalized.contains("children")) {
                mapped.add(BookGenre.CHILDREN);
            } else if (normalized.contains("young adult")) {
                mapped.add(BookGenre.YOUNG_ADULT);
            } else if (normalized.contains("education")) {
                mapped.add(BookGenre.EDUCATION);
            } else if (normalized.contains("fiction")) {
                mapped.add(BookGenre.FICTION);
            }
        }

        return mapped;
    }

    private String normalizeLanguage(String language) {
        String value = trimToNull(language);
        if (value == null) {
            return "en";
        }

        String lowered = value.toLowerCase(Locale.ROOT);
        return switch (lowered) {
            case "eng", "en" -> "en";
            case "spa", "es" -> "es";
            case "fra", "fre", "fr" -> "fr";
            case "deu", "ger", "de" -> "de";
            case "ita", "it" -> "it";
            case "por", "pt" -> "pt";
            default -> lowered.length() > 2 ? lowered.substring(0, 2) : lowered;
        };
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
