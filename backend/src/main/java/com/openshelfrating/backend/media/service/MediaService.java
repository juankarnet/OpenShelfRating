package com.openshelfrating.backend.media.service;

import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.auth.domain.UserRole;
import com.openshelfrating.backend.auth.repository.UserAccountRepository;
import com.openshelfrating.backend.catalog.domain.Book;
import com.openshelfrating.backend.catalog.repository.BookRepository;
import com.openshelfrating.backend.media.api.MediaAccessResponse;
import com.openshelfrating.backend.media.api.MediaUploadResponse;
import com.openshelfrating.backend.media.config.MediaProperties;
import com.openshelfrating.backend.media.domain.MediaResourceType;
import com.openshelfrating.backend.media.domain.MediaUpload;
import com.openshelfrating.backend.media.repository.MediaUploadRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional
public class MediaService {

    private final MediaUploadRepository mediaUploadRepository;
    private final UserAccountRepository userAccountRepository;
    private final BookRepository bookRepository;
    private final S3StorageAdapter s3StorageAdapter;
    private final MediaProperties mediaProperties;
    private final HttpClient httpClient;

    public MediaService(
            MediaUploadRepository mediaUploadRepository,
            UserAccountRepository userAccountRepository,
            BookRepository bookRepository,
            S3StorageAdapter s3StorageAdapter,
            MediaProperties mediaProperties
    ) {
        this.mediaUploadRepository = mediaUploadRepository;
        this.userAccountRepository = userAccountRepository;
        this.bookRepository = bookRepository;
        this.s3StorageAdapter = s3StorageAdapter;
        this.mediaProperties = mediaProperties;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    public MediaUploadResponse uploadAvatar(UUID pathUserId, UUID principalUserId, MultipartFile file) {
        UserAccount actor = authorizeOwnerOrAdmin(pathUserId, principalUserId);
        validateUpload(file, mediaProperties.getMaxAvatarSize());

        UserAccount target = getUser(pathUserId);
        softDeleteActiveMedia(MediaResourceType.AVATAR, pathUserId);

        String path = buildObjectPath("avatars", pathUserId, file.getContentType());
        uploadToStorage(path, file);

        target.setAvatarUrl(path);
        userAccountRepository.save(target);

        MediaUpload mediaUpload = persistUpload(MediaResourceType.AVATAR, pathUserId, path, file);
        return toUploadResponse(mediaUpload);
    }

    public MediaUploadResponse uploadCover(UUID bookId, UUID principalUserId, MultipartFile file) {
        validateUpload(file, mediaProperties.getMaxCoverSize());

        Book book = getBook(bookId);
        UserAccount actor = authorizeCoverOwnerOrAdmin(principalUserId, book);
        MediaUpload existing = mediaUploadRepository
                .findFirstByResourceTypeAndResourceIdAndDeletedAtIsNullOrderByUploadedAtDesc(MediaResourceType.COVER, bookId)
                .orElse(null);

        softDeleteActiveMedia(MediaResourceType.COVER, bookId);

        String path = buildObjectPath("covers", bookId, file.getContentType());
        uploadToStorage(path, file);

        book.setCoverUrl(path);
        bookRepository.save(book);

        MediaUpload mediaUpload = persistUpload(MediaResourceType.COVER, bookId, path, file);
        return toUploadResponse(mediaUpload);
    }

    @Transactional(readOnly = true)
    public MediaAccessResponse getAvatar(UUID userId) {
        UserAccount user = getUser(userId);
        String avatarPath = user.getAvatarUrl();
        if (avatarPath == null || avatarPath.isBlank()) {
            return new MediaAccessResponse(mediaProperties.getAvatarPlaceholderUrl(), null, true);
        }
        return new MediaAccessResponse(generatePresignedUrl(avatarPath), calculateExpiry(), false);
    }

    @Transactional(readOnly = true)
    public MediaAccessResponse getCover(UUID bookId) {
        Book book = getBook(bookId);
        String coverPath = book.getCoverUrl();
        if (coverPath == null || coverPath.isBlank()) {
            return new MediaAccessResponse(mediaProperties.getCoverPlaceholderUrl(), null, true);
        }
        return new MediaAccessResponse(generatePresignedUrl(coverPath), calculateExpiry(), false);
    }

    public void deleteAvatar(UUID pathUserId, UUID principalUserId) {
        authorizeOwnerOrAdmin(pathUserId, principalUserId);
        UserAccount user = getUser(pathUserId);

        softDeleteActiveMedia(MediaResourceType.AVATAR, pathUserId);
        user.setAvatarUrl(null);
        userAccountRepository.save(user);
    }

    public void deleteCover(UUID bookId, UUID principalUserId) {
        Book book = getBook(bookId);
        authorizeCoverOwnerOrAdmin(principalUserId, book);

        softDeleteActiveMedia(MediaResourceType.COVER, bookId);
        book.setCoverUrl(null);
        bookRepository.save(book);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importCoverFromExternalUrl(UUID bookId, UUID principalUserId, String coverUrl) {
        if (coverUrl == null || coverUrl.isBlank()) {
            return;
        }

        Book book = getBook(bookId);
        authorizeCoverOwnerOrAdmin(principalUserId, book);

        DownloadedExternalFile downloaded = downloadExternalImage(coverUrl.trim());

        softDeleteActiveMedia(MediaResourceType.COVER, bookId);
        String path = buildObjectPath("covers", bookId, downloaded.mimeType());

        try (InputStream inputStream = new ByteArrayInputStream(downloaded.content())) {
            s3StorageAdapter.uploadFile(path, inputStream, downloaded.content().length, downloaded.mimeType());
        } catch (IOException ex) {
            throw new MediaException(HttpStatus.BAD_GATEWAY, "Failed to read downloaded cover image");
        }

        book.setCoverUrl(path);
        bookRepository.save(book);

        MediaUpload mediaUpload = new MediaUpload();
        mediaUpload.setResourceType(MediaResourceType.COVER);
        mediaUpload.setResourceId(bookId);
        mediaUpload.setS3Path(path);
        mediaUpload.setMimeType(downloaded.mimeType());
        mediaUpload.setFileSize(downloaded.content().length);
        mediaUploadRepository.save(mediaUpload);
    }

    private UserAccount authorizeOwnerOrAdmin(UUID pathUserId, UUID principalUserId) {
        UUID effectivePrincipal = principalUserId != null ? principalUserId : pathUserId;
        UserAccount requester = getUser(effectivePrincipal);

        boolean owner = Objects.equals(requester.getId(), pathUserId);
        boolean admin = requester.getRole() == UserRole.ADMIN;
        if (!owner && !admin) {
            throw new MediaException(HttpStatus.FORBIDDEN, "Only owner or admin can manage avatar");
        }
        return requester;
    }

    private UserAccount resolveCoverActor(UUID principalUserId, Book book) {
        UUID effectivePrincipal = principalUserId != null ? principalUserId : book.getCreatedBy().getId();
        return getUser(effectivePrincipal);
    }

    private UserAccount authorizeCoverOwnerOrAdmin(UUID principalUserId, Book book) {
        UserAccount requester = resolveCoverActor(principalUserId, book);
        boolean owner = book.getCreatedBy() != null && book.getCreatedBy().getId().equals(requester.getId());
        boolean admin = requester.getRole() == UserRole.ADMIN;
        if (!owner && !admin) {
            throw new MediaException(HttpStatus.FORBIDDEN, "Only the creator or an admin can manage this cover");
        }
        return requester;
    }

    private UserAccount getUser(UUID userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new MediaException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Book getBook(UUID bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new MediaException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    private void validateUpload(MultipartFile file, long maxSize) {
        if (file == null || file.isEmpty()) {
            throw new MediaException(HttpStatus.BAD_REQUEST, "File is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || mediaProperties.getAllowedMimeTypes().stream().noneMatch(contentType::equalsIgnoreCase)) {
            throw new MediaException(HttpStatus.BAD_REQUEST, "Unsupported MIME type");
        }

        if (file.getSize() > maxSize) {
            throw new MediaException(HttpStatus.PAYLOAD_TOO_LARGE, "Uploaded file exceeds allowed size");
        }
    }

    private String buildObjectPath(String root, UUID resourceId, String mimeType) {
        String extension = extensionFromMimeType(mimeType);
        return root + "/" + resourceId + "/" + System.currentTimeMillis() + "." + extension;
    }

    private String extensionFromMimeType(String mimeType) {
        String normalized = mimeType.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> throw new MediaException(HttpStatus.BAD_REQUEST, "Unsupported MIME type");
        };
    }

    private void uploadToStorage(String path, MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            s3StorageAdapter.uploadFile(path, inputStream, file.getSize(), file.getContentType());
        } catch (IOException ex) {
            throw new MediaException(HttpStatus.BAD_GATEWAY, "Failed to read uploaded file");
        }
    }

    private MediaUpload persistUpload(MediaResourceType type, UUID resourceId, String path, MultipartFile file) {
        MediaUpload mediaUpload = new MediaUpload();
        mediaUpload.setResourceType(type);
        mediaUpload.setResourceId(resourceId);
        mediaUpload.setS3Path(path);
        mediaUpload.setMimeType(file.getContentType());
        mediaUpload.setFileSize(file.getSize());
        return mediaUploadRepository.save(mediaUpload);
    }

    private MediaUploadResponse toUploadResponse(MediaUpload mediaUpload) {
        return new MediaUploadResponse(
                mediaUpload.getId(),
                generatePresignedUrl(mediaUpload.getS3Path()),
                calculateExpiry(),
                mediaUpload.getMimeType(),
                mediaUpload.getFileSize()
        );
    }

    private String generatePresignedUrl(String path) {
        return s3StorageAdapter.generatePresignedGetUrl(path, Duration.ofHours(mediaProperties.getPresignedUrlExpiryHours()));
    }

    private OffsetDateTime calculateExpiry() {
        return OffsetDateTime.now().plusHours(mediaProperties.getPresignedUrlExpiryHours());
    }

    private void softDeleteActiveMedia(MediaResourceType type, UUID resourceId) {
        OffsetDateTime now = OffsetDateTime.now();
        for (MediaUpload upload : mediaUploadRepository.findByResourceTypeAndResourceIdAndDeletedAtIsNull(type, resourceId)) {
            upload.setDeletedAt(now);
            mediaUploadRepository.save(upload);
        }
    }

    private DownloadedExternalFile downloadExternalImage(String url) {
        HttpRequest request;
        try {
            request = HttpRequest.newBuilder(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();
        } catch (IllegalArgumentException ex) {
            throw new MediaException(HttpStatus.BAD_REQUEST, "Invalid cover URL");
        }

        HttpResponse<InputStream> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new MediaException(HttpStatus.BAD_GATEWAY, "Failed to download cover image");
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new MediaException(HttpStatus.BAD_GATEWAY, "Cover image URL returned non-success response");
        }

        String mimeType = response.headers().firstValue("Content-Type").orElse("image/jpeg");
        if (mimeType.contains(";")) {
            mimeType = mimeType.substring(0, mimeType.indexOf(';')).trim();
        }

        if (mediaProperties.getAllowedMimeTypes().stream().noneMatch(mimeType::equalsIgnoreCase)) {
            throw new MediaException(HttpStatus.BAD_REQUEST, "Unsupported cover MIME type from external URL");
        }

        long maxCoverSize = mediaProperties.getMaxCoverSize();
        byte[] content = readAllBytesWithLimit(response.body(), maxCoverSize);
        if (content.length == 0) {
            throw new MediaException(HttpStatus.BAD_REQUEST, "Downloaded cover image is empty");
        }

        return new DownloadedExternalFile(mimeType, content);
    }

    private byte[] readAllBytesWithLimit(InputStream inputStream, long maxBytes) {
        try (InputStream in = inputStream; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            long total = 0;
            int read;
            while ((read = in.read(buffer)) != -1) {
                total += read;
                if (total > maxBytes) {
                    throw new MediaException(HttpStatus.PAYLOAD_TOO_LARGE, "External cover exceeds max allowed size");
                }
                out.write(buffer, 0, read);
            }
            return out.toByteArray();
        } catch (IOException ex) {
            throw new MediaException(HttpStatus.BAD_GATEWAY, "Failed to read downloaded cover image");
        }
    }

    private record DownloadedExternalFile(String mimeType, byte[] content) {
    }
}
