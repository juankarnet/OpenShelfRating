package com.openshelfrating.backend.library.service;

import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.auth.domain.UserRole;
import com.openshelfrating.backend.auth.repository.UserAccountRepository;
import com.openshelfrating.backend.catalog.domain.Book;
import com.openshelfrating.backend.catalog.repository.BookRepository;
import com.openshelfrating.backend.library.domain.ReadingState;
import com.openshelfrating.backend.library.domain.UserBook;
import com.openshelfrating.backend.library.repository.UserBookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for UserLibraryService.removeBookFromLibrary — SPEC-0008.
 * REQ-001, REQ-002, REQ-003, REQ-004 (backend).
 */
@ExtendWith(MockitoExtension.class)
class UserLibraryServiceRemoveTest {

    @Mock private UserBookRepository userBookRepository;
    @Mock private UserAccountRepository userAccountRepository;
    @Mock private BookRepository bookRepository;

    @InjectMocks
    private UserLibraryService userLibraryService;

    private UUID ownerId;
    private UUID bookId;
    private UUID userBookId;
    private UserAccount ownerAccount;
    private UserBook activeUserBook;

    @BeforeEach
    void setUp() throws Exception {
        ownerId = UUID.randomUUID();
        bookId = UUID.randomUUID();
        userBookId = UUID.randomUUID();

        ownerAccount = new UserAccount();
        setField(ownerAccount, "id", ownerId);
        ownerAccount.setRole(UserRole.USER);

        Book book = new Book();

        activeUserBook = new UserBook();
        setField(activeUserBook, "id", userBookId);
        activeUserBook.setUser(ownerAccount);
        activeUserBook.setBook(book);
        activeUserBook.setReadingState(ReadingState.PENDING);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        var field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    // ── AC-001: owner removes active book → deletedAt is set ──────────────────

    @Test
    void shouldSoftDeleteActiveUserBook_whenOwnerRemoves() {
        when(userAccountRepository.findById(ownerId)).thenReturn(Optional.of(ownerAccount));
        when(userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(ownerId, bookId))
                .thenReturn(Optional.of(activeUserBook));

        userLibraryService.removeBookFromLibrary(ownerId, ownerId, bookId);

        ArgumentCaptor<UserBook> captor = ArgumentCaptor.forClass(UserBook.class);
        verify(userBookRepository).save(captor.capture());

        UserBook saved = captor.getValue();
        assertNotNull(saved.getDeletedAt(), "deletedAt must be set on soft-delete");
    }

    @Test
    void softDeleteTimestamp_shouldBeRecentlyNow() {
        when(userAccountRepository.findById(ownerId)).thenReturn(Optional.of(ownerAccount));
        when(userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(ownerId, bookId))
                .thenReturn(Optional.of(activeUserBook));

        OffsetDateTime before = OffsetDateTime.now().minusSeconds(1);
        userLibraryService.removeBookFromLibrary(ownerId, ownerId, bookId);
        OffsetDateTime after = OffsetDateTime.now().plusSeconds(1);

        ArgumentCaptor<UserBook> captor = ArgumentCaptor.forClass(UserBook.class);
        verify(userBookRepository).save(captor.capture());

        OffsetDateTime deletedAt = captor.getValue().getDeletedAt();
        assertNotNull(deletedAt);
        assertEquals(true, deletedAt.isAfter(before) && deletedAt.isBefore(after),
                "deletedAt should be within current timestamp window");
    }

    // ── AC-003: non-owner without admin role → 403 ───────────────────────────

    @Test
    void shouldThrow403_whenNonOwnerNonAdminAttempsRemoval() throws Exception {
        UUID otherUserId = UUID.randomUUID();
        UserAccount otherAccount = new UserAccount();
        setField(otherAccount, "id", otherUserId);
        otherAccount.setRole(UserRole.USER);

        when(userAccountRepository.findById(otherUserId)).thenReturn(Optional.of(otherAccount));

        LibraryException ex = assertThrows(LibraryException.class,
                () -> userLibraryService.removeBookFromLibrary(ownerId, otherUserId, bookId));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(userBookRepository, never()).save(any());
    }

    // ── AC-003 variant: admin can remove any user's book ─────────────────────

    @Test
    void shouldAllowRemoval_whenAdminRemovesOwnerBook() throws Exception {
        UUID adminId = UUID.randomUUID();
        UserAccount admin = new UserAccount();
        setField(admin, "id", adminId);
        admin.setRole(UserRole.ADMIN);

        when(userAccountRepository.findById(adminId)).thenReturn(Optional.of(admin));
        when(userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(ownerId, bookId))
                .thenReturn(Optional.of(activeUserBook));

        userLibraryService.removeBookFromLibrary(ownerId, adminId, bookId);

        verify(userBookRepository).save(any(UserBook.class));
    }

    // ── AC-004: book not in active library → 404 ─────────────────────────────

    @Test
    void shouldThrow404_whenBookNotFoundInActiveLibrary() {
        when(userAccountRepository.findById(ownerId)).thenReturn(Optional.of(ownerAccount));
        when(userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(ownerId, bookId))
                .thenReturn(Optional.empty());

        LibraryException ex = assertThrows(LibraryException.class,
                () -> userLibraryService.removeBookFromLibrary(ownerId, ownerId, bookId));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verify(userBookRepository, never()).save(any());
    }

    // ── AC-004 variant: unauthenticated user (account not found) → 401 ───────

    @Test
    void shouldThrow401_whenPrincipalUserNotFoundInSystem() {
        UUID unknownUserId = UUID.randomUUID();
        when(userAccountRepository.findById(unknownUserId)).thenReturn(Optional.empty());

        LibraryException ex = assertThrows(LibraryException.class,
                () -> userLibraryService.removeBookFromLibrary(ownerId, unknownUserId, bookId));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
        verify(userBookRepository, never()).save(any());
    }

    // ── Guard: no physical deletion ───────────────────────────────────────────

    @Test
    void shouldNeverCallDelete_onlySetDeletedAt() {
        when(userAccountRepository.findById(ownerId)).thenReturn(Optional.of(ownerAccount));
        when(userBookRepository.findByUserIdAndBookIdAndDeletedAtIsNull(ownerId, bookId))
                .thenReturn(Optional.of(activeUserBook));

        userLibraryService.removeBookFromLibrary(ownerId, ownerId, bookId);

        verify(userBookRepository, never()).delete(any());
        verify(userBookRepository, never()).deleteById(any());
    }
}
