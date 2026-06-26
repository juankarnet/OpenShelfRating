package com.openshelfrating.backend.media.service;

import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.auth.domain.UserRole;
import com.openshelfrating.backend.auth.repository.UserAccountRepository;
import com.openshelfrating.backend.catalog.repository.BookRepository;
import com.openshelfrating.backend.media.config.MediaProperties;
import com.openshelfrating.backend.media.repository.MediaUploadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MediaServiceValidationTest {

    private MediaUploadRepository mediaUploadRepository;
    private UserAccountRepository userAccountRepository;
    private BookRepository bookRepository;
    private S3StorageAdapter s3StorageAdapter;
    private MediaProperties mediaProperties;
    private MediaService mediaService;

    @BeforeEach
    void setup() {
        mediaUploadRepository = mock(MediaUploadRepository.class);
        userAccountRepository = mock(UserAccountRepository.class);
        bookRepository = mock(BookRepository.class);
        s3StorageAdapter = mock(S3StorageAdapter.class);
        mediaProperties = new MediaProperties();

        mediaService = new MediaService(
                mediaUploadRepository,
                userAccountRepository,
                bookRepository,
                s3StorageAdapter,
                mediaProperties
        );
    }

    @Test
    void shouldRejectUnsupportedMimeType() {
        UUID userId = UUID.randomUUID();

        UserAccount user = new UserAccount();
        user.setRole(UserRole.ADMIN);
        user.setDisplayName("user");
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(user));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.bmp",
                "image/bmp",
                new byte[]{1, 2, 3}
        );

        MediaException ex = assertThrows(MediaException.class, () -> mediaService.uploadAvatar(userId, userId, file));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void shouldRejectOversizedAvatar() {
        UUID userId = UUID.randomUUID();

        UserAccount user = new UserAccount();
        user.setRole(UserRole.ADMIN);
        user.setDisplayName("user");
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(user));

        byte[] oversized = new byte[(int) mediaProperties.getMaxAvatarSize() + 1];
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                oversized
        );

        MediaException ex = assertThrows(MediaException.class, () -> mediaService.uploadAvatar(userId, userId, file));
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, ex.getStatus());
    }
}
