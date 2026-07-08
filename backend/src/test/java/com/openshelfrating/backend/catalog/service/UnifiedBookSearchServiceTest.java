package com.openshelfrating.backend.catalog.service;

import com.openshelfrating.backend.catalog.api.AddFromSearchRequest;
import com.openshelfrating.backend.catalog.api.AddFromSearchResponse;
import com.openshelfrating.backend.catalog.api.BookResponse;
import com.openshelfrating.backend.catalog.api.MetadataCompletionStatus;
import com.openshelfrating.backend.catalog.api.UnifiedSearchResponse;
import com.openshelfrating.backend.catalog.api.UnifiedSearchSource;
import com.openshelfrating.backend.catalog.api.UnifiedSearchStatus;
import com.openshelfrating.backend.catalog.domain.Book;
import com.openshelfrating.backend.catalog.domain.BookGenre;
import com.openshelfrating.backend.catalog.repository.BookRepository;
import com.openshelfrating.backend.library.api.UserBookResponse;
import com.openshelfrating.backend.library.domain.ReadingState;
import com.openshelfrating.backend.library.domain.UserBook;
import com.openshelfrating.backend.library.repository.UserBookRepository;
import com.openshelfrating.backend.library.service.UserLibraryService;
import com.openshelfrating.backend.media.service.MediaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UnifiedBookSearchServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserBookRepository userBookRepository;

    @Mock
    private UserLibraryService userLibraryService;

    @Mock
    private BookService bookService;

    @Mock
    private IsbnValidator isbnValidator;

    @Mock
    private TitleAuthorNormalizer normalizer;

    @Mock
    private OpenLibraryClient openLibraryClient;

    @Mock
    private MediaService mediaService;

    @InjectMocks
    private UnifiedBookSearchService unifiedBookSearchService;

    private UUID actorUserId;
    private UUID localBookId;

    @BeforeEach
    void setUp() {
        actorUserId = UUID.randomUUID();
        localBookId = UUID.randomUUID();
    }

    @Test
    void shouldReturnLocalIsbnResultAndMarkExistsInUserLibrary() {
        String isbn = "9780306406157";
        Book book = sampleBook(localBookId, isbn, null, "The Hobbit", "Tolkien", "Allen", 300, "en");

        when(isbnValidator.normalizeIsbn(isbn)).thenReturn(isbn);
        when(bookRepository.findByIsbn13(isbn)).thenReturn(Optional.of(book));
        when(userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(actorUserId, localBookId))
                .thenReturn(Optional.of(new UserBook()));

        UnifiedSearchResponse response = unifiedBookSearchService.searchUnified(isbn, actorUserId, 10);

        assertEquals(1, response.count());
        assertEquals(List.of("LOCAL_DB"), response.searchedSources());
        assertFalse(response.externalSearchFailed());
        assertEquals(UnifiedSearchSource.LOCAL_DB, response.results().get(0).source());
        assertEquals(UnifiedSearchStatus.EXISTS_IN_USER_LIBRARY, response.results().get(0).status());
        assertEquals(MetadataCompletionStatus.COMPLETE, response.results().get(0).metadataCompletionStatus());
        verify(openLibraryClient, never()).searchByIsbn(any());
    }

    @Test
    void shouldFallbackToOpenLibraryWhenNoLocalTextResults() {
        String query = "tolkien";
        OpenLibraryClient.ExternalBookCandidate candidate = new OpenLibraryClient.ExternalBookCandidate(
                "The Silmarillion",
                "J. R. R. Tolkien",
                List.of("Christopher Tolkien"),
                "9780618391110",
                null,
                null,
                LocalDate.of(2001, 1, 1),
                null,
                null,
                List.of("Fantasy fiction"),
                "https://covers.openlibrary.org/b/id/123-M.jpg",
                "/works/OL123W"
        );

        when(isbnValidator.normalizeIsbn(query)).thenReturn(query.toUpperCase());
        when(bookRepository.searchCanonicalByTitle(eq(query), any(Pageable.class))).thenReturn(emptyPage());
        when(bookRepository.searchCanonicalByAuthor(eq(query), any(Pageable.class))).thenReturn(emptyPage());
        when(openLibraryClient.searchByTitle(query, 10)).thenReturn(List.of(candidate));

        UnifiedSearchResponse response = unifiedBookSearchService.searchUnified(query, actorUserId, 10);

        assertEquals(1, response.count());
        assertEquals(List.of("LOCAL_DB", "OPEN_LIBRARY"), response.searchedSources());
        assertFalse(response.externalSearchFailed());
        assertEquals(UnifiedSearchSource.OPEN_LIBRARY, response.results().get(0).source());
        assertEquals(UnifiedSearchStatus.AVAILABLE_FOR_IMPORT, response.results().get(0).status());
        assertEquals(MetadataCompletionStatus.INCOMPLETE, response.results().get(0).metadataCompletionStatus());
    }

    @Test
    void shouldAddLocalBookToUserLibraryFromSearchResult() {
        UUID userBookId = UUID.randomUUID();
        AddFromSearchRequest request = new AddFromSearchRequest(
                UnifiedSearchSource.LOCAL_DB,
                localBookId,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        when(userLibraryService.addBookToLibrary(actorUserId, actorUserId, localBookId))
                .thenReturn(userBookResponse(userBookId));

        AddFromSearchResponse response = unifiedBookSearchService.addFromSearchResult(request, actorUserId);

        assertEquals(localBookId, response.bookId());
        assertEquals(userBookId, response.userBookId());
        assertFalse(response.createdInSystem());
        assertEquals(UnifiedSearchStatus.EXISTS_IN_SYSTEM, response.status());
        verify(bookService, never()).createBook(any(), any());
        verify(mediaService, never()).importCoverFromExternalUrl(any(), any(), any());
    }

    @Test
    void shouldCreateAndAddBookWhenImportingFromOpenLibrary() {
        UUID createdBookId = UUID.randomUUID();
        UUID userBookId = UUID.randomUUID();
        AddFromSearchRequest request = new AddFromSearchRequest(
                UnifiedSearchSource.OPEN_LIBRARY,
                null,
                "Dune",
                "Frank Herbert",
                List.of(),
                "9780441172719",
                null,
                "Ace",
                LocalDate.of(1965, 1, 1),
                412,
                "en",
                Set.of(BookGenre.SCIENCE_FICTION),
                "https://covers.openlibrary.org/b/id/456-M.jpg",
                "/works/OL456W"
        );

        when(bookService.createBook(any(), eq(actorUserId)))
                .thenReturn(new BookResponse(
                        createdBookId,
                        "Dune",
                        "Frank Herbert",
                        List.of(),
                        "9780441172719",
                        null,
                        "Ace",
                        LocalDate.of(1965, 1, 1),
                        412,
                        "en",
                        Set.of(BookGenre.SCIENCE_FICTION),
                        "https://covers.openlibrary.org/b/id/456-M.jpg",
                        null,
                        actorUserId,
                        null,
                        true,
                        OffsetDateTime.now(),
                        OffsetDateTime.now(),
                        false
                ));

        when(userLibraryService.addBookToLibrary(actorUserId, actorUserId, createdBookId))
                .thenReturn(userBookResponse(userBookId));

        AddFromSearchResponse response = unifiedBookSearchService.addFromSearchResult(request, actorUserId);

        assertEquals(createdBookId, response.bookId());
        assertEquals(userBookId, response.userBookId());
        assertTrue(response.createdInSystem());
        assertEquals(UnifiedSearchStatus.AVAILABLE_FOR_IMPORT, response.status());
        verify(mediaService, times(1)).importCoverFromExternalUrl(createdBookId, actorUserId, "https://covers.openlibrary.org/b/id/456-M.jpg");
    }

    @Test
    void shouldFailExternalImportWhenRequiredFieldsAreMissing() {
        AddFromSearchRequest request = new AddFromSearchRequest(
                UnifiedSearchSource.OPEN_LIBRARY,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertThrows(CatalogException.class, () -> unifiedBookSearchService.addFromSearchResult(request, actorUserId));
    }

    private Book sampleBook(
            UUID id,
            String isbn13,
            String isbn10,
            String title,
            String primaryAuthor,
            String publisher,
            Integer pages,
            String language
    ) {
        Book book = new Book();
        // ID is required by the response mapper in assertions.
        try {
            var idField = Book.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(book, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
        book.setIsbn13(isbn13);
        book.setIsbn10(isbn10);
        book.setTitle(title);
        book.setPrimaryAuthor(primaryAuthor);
        book.setPublisher(publisher);
        book.setPages(pages);
        book.setLanguage(language);
        book.setGenres(Set.of(BookGenre.FICTION));
        return book;
    }

    private Page<Book> emptyPage() {
        return new PageImpl<>(List.of());
    }

    private UserBookResponse userBookResponse(UUID userBookId) {
        return new UserBookResponse(
                userBookId,
                null,
                ReadingState.PENDING,
                OffsetDateTime.now(),
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
