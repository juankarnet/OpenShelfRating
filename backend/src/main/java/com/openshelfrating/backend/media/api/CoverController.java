package com.openshelfrating.backend.media.api;

import com.openshelfrating.backend.media.config.MediaProperties;
import com.openshelfrating.backend.media.service.MediaService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/books/{bookId}/cover")
public class CoverController {

    private final MediaService mediaService;
    private final MediaProperties mediaProperties;

    public CoverController(MediaService mediaService, MediaProperties mediaProperties) {
        this.mediaService = mediaService;
        this.mediaProperties = mediaProperties;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> uploadCover(
            @PathVariable UUID bookId,
            @AuthenticationPrincipal UUID principalUserId,
            @RequestParam("file") MultipartFile file
    ) {
        MediaUploadResponse response = mediaService.uploadCover(bookId, principalUserId, file);
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<MediaAccessResponse> getCover(@PathVariable UUID bookId) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=" + mediaProperties.getCacheMaxAgeSeconds())
                .body(mediaService.getCover(bookId));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteCover(
            @PathVariable UUID bookId,
            @AuthenticationPrincipal UUID principalUserId
    ) {
        mediaService.deleteCover(bookId, principalUserId);
        return ResponseEntity.noContent().build();
    }
}
