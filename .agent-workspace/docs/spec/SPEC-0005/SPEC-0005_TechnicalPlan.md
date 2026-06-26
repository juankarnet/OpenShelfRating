# Technical Plan: SPEC-0005 - Media Management (Avatars & Book Covers)

## 1. Overview
This technical plan outlines the implementation strategy for SPEC-0005 (Media Management). Status: **Implemented baseline**.

## 2. Architecture & Pattern
*   **Pattern:** Service-oriented; S3-compatible storage abstraction
*   **Integration Points:** UserAccount (avatarUrl stores stable object path), Book (coverUrl stores stable object path)

## 3. Implementation Components

### 3.1 Domain Layer Extensions

```
com.openshelfrating.backend.media.domain/
├── MediaUpload.java (JPA Entity for audit)
│   ├── id (UUID PK)
│   ├── resourceType (ENUM: AVATAR, COVER)
│   ├── resourceId (UUID — user_id or book_id)
│   ├── s3Path (VARCHAR, immutable)
│   ├── mimeType (VARCHAR)
│   ├── fileSize (LONG)
│   ├── uploadedAt (TIMESTAMPTZ)
│   └── deletedAt (TIMESTAMPTZ, nullable)
└── MediaUploadResult.java (DTO)
    ├── uploadId (UUID)
    ├── presignedUrl (String)
    ├── expiresAt (LocalDateTime)
```

### 3.2 Service Layer

```
com.openshelfrating.backend.media.service/
├── MediaUploadService (@Transactional)
│   ├── uploadAvatar(UUID userId, MultipartFile file) → MediaUploadResult
│   │   Validate: MIME in {jpeg, png, webp}, size ≤5MB
│   │   Generate: s3Path = /avatars/{userId}/{timestamp}.{ext}
│   │   Store: S3 + update UserAccount.avatarUrl
│   │   Return: presigned URL (24h) + metadata
│   │
│   ├── uploadBookCover(UUID bookId, MultipartFile file) → MediaUploadResult
│   │   Validate: MIME in {jpeg, png, webp}, size ≤10MB
│   │   Generate: s3Path = /covers/{bookId}/{timestamp}.{ext}
│   │   Store: S3 + update Book.coverUrl
│   │   Return: presigned URL (24h) + metadata
│   │
│   ├── getAvatarAccess(UUID userId) → MediaAccessResponse
│   ├── getCoverAccess(UUID bookId) → MediaAccessResponse
│   ├── deleteAvatar(UUID userId) → void
│   └── deleteBookCover(UUID bookId) → void
│       Soft-delete: set deletedAt, keep S3 object for audit
│
└── S3StorageAdapter
    ├── uploadFile(String s3Path, InputStream, String mimeType) → boolean
    ├── generatePresignedUrl(String s3Path, Duration expiry) → String
    ├── deleteFile(String s3Path) → boolean
    └── getFileMetadata(String s3Path) → FileMetadata
```

### 3.3 API Layer

**DTOs:**
```java
record UploadAvatarRequest(
    @NotNull MultipartFile file
) {}

record UploadCoverRequest(
    @NotNull MultipartFile file
) {}

record MediaUploadResponse(
    UUID uploadId,
    String presignedUrl,
    LocalDateTime expiresAt,
    String mimeType,
    Long fileSize
) {}
```

**Controllers:**
```java
@RestController
@RequestMapping("/users/{userId}/avatar")
public class AvatarController {
    @PostMapping
    public ResponseEntity<MediaUploadResponse> uploadAvatar(
        @PathVariable UUID userId,
        @RequestParam("file") MultipartFile file
    ) { /* 201 Created */ }

    @GetMapping
    public ResponseEntity<MediaAccessResponse> getAvatar(
        @PathVariable UUID userId
    ) { /* 200 JSON with presignedUrl + expiresAt */ }

    @DeleteMapping
    public ResponseEntity<Void> deleteAvatar(@PathVariable UUID userId) { /* 204 */ }
}

@RestController
@RequestMapping("/books/{bookId}/cover")
public class CoverController {
    @PostMapping
    public ResponseEntity<MediaUploadResponse> uploadCover(
        @PathVariable UUID bookId,
        @RequestParam("file") MultipartFile file
    ) { /* 201 Created */ }
    
    @GetMapping
    public ResponseEntity<MediaAccessResponse> getCover(
        @PathVariable UUID bookId
    ) { /* 200 JSON with presignedUrl + expiresAt */ }

    @DeleteMapping
    public ResponseEntity<Void> deleteCover(@PathVariable UUID bookId) { /* 204 */ }
}
```

**Exception Handling:**
```java
public class MediaException extends RuntimeException {
    // INVALID_MIME_TYPE, FILE_TOO_LARGE, S3_UPLOAD_FAILED, UNAUTHORIZED
}

@RestControllerAdvice
public class MediaExceptionHandler {
    @ExceptionHandler(MediaException.class)
    public ResponseEntity<ApiErrorResponse> handleMediaException(MediaException ex) { }
}
```

### 3.4 Configuration

**Build Dependencies:**
```gradle
implementation("org.springframework.cloud:spring-cloud-aws-s3")
// or
implementation("software.amazon.awssdk:s3")
```

**Properties:** `application.properties` (additions)
```properties
app.media.allowed-mime-types=image/jpeg,image/png,image/webp
app.media.max-avatar-size=5242880       # 5MB in bytes
app.media.max-cover-size=10485760       # 10MB in bytes
app.media.presigned-url-expiry-hours=24
aws.s3.bucket-name=${AWS_S3_BUCKET:openshelfrating-media}
aws.s3.region=${AWS_REGION:eu-west-1}
```

### 3.5 Database Schema

**Flyway V5 Migration:** `V5__create_media_upload_audit_table.sql`

```sql
CREATE TABLE media_uploads (
    id UUID PRIMARY KEY,
    resource_type VARCHAR(20) NOT NULL,  -- AVATAR, COVER
    resource_id UUID NOT NULL,
    s3_path VARCHAR(2048) NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    UNIQUE(s3_path)
);

CREATE INDEX idx_media_resource ON media_uploads(resource_type, resource_id, deleted_at);

-- Add columns to existing tables
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(2048);
-- book.cover_url already exists from SPEC-0002

CREATE INDEX idx_users_avatar_url ON users(avatar_url);
```

## 4. S3 Configuration Details

### MinIO (Development)
```properties
# Local MinIO setup
spring.cloud.aws.s3.endpoint=http://localhost:9000
spring.cloud.aws.s3.region=us-east-1
aws.accessKeyId=${MINIO_ROOT_USER:minioadmin}
aws.secretAccessKey=${MINIO_ROOT_PASSWORD:minioadmin}
```

### AWS S3 (Production)
```properties
spring.cloud.aws.s3.region=eu-west-1
aws.accessKeyId=${AWS_ACCESS_KEY_ID}
aws.secretAccessKey=${AWS_SECRET_ACCESS_KEY}
```

## 5. Implementation Sequence

| Phase | Components | Duration |
|-------|-----------|----------|
| **1. Config** | S3 adapter, AWS SDK setup | 0.5h |
| **2. Domain** | MediaUpload entity, exceptions | 0.5h |
| **3. Service** | Upload logic, MIME validation, presigned URLs | 1.5h |
| **4. API** | AvatarController, CoverController | 0.5h |
| **5. Testing** | Upload tests, S3 mocking | 1.5h |
| **Total** | — | **~4.5 hours** |

## 6. Success Criteria
- ✅ All 7 REQs implemented
- ✅ All 6 ACs pass
- ✅ MIME type validation (jpeg, png, webp only)
- ✅ Size limits enforced (5MB avatar, 10MB cover)
- ✅ Presigned URLs generated (24h expiry)
- ✅ Authorization checked (owner/admin only)
- ✅ Authorization rules enforced: avatar owner/admin; cover create by authenticated user when absent; cover replace/delete by admin
- ✅ NFR-001: Upload <2s, presigned URL <100ms
- ✅ Integration tests with MinIO

## 7. Security Considerations

| Aspect | Implementation |
|--------|-----------------|
| **MIME Validation** | Server-side validation, not client |
| **File Size Limits** | Streaming validation, reject at boundary |
| **Access Control** | @PreAuthorize("@mediaService.canUpload(principal)") |
| **S3 Security** | Presigned URLs, 24h expiry, no public buckets |
| **Audit Trail** | MediaUpload table tracks all uploads + soft-delete |

## 8. Performance Optimization

- Streaming upload (no full buffer to memory)
- Async S3 operations (Spring Async)
- Presigned URLs for direct S3 retrieval (bypass backend)
- 24h cache headers on images

## 9. Future Enhancements

- Image resizing/thumbnail generation
- CDN integration (CloudFront)
- Version history (multi-generation media)
- Analytics (upload frequency, storage usage)
