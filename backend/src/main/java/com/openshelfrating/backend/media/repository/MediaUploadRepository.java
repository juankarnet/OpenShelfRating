package com.openshelfrating.backend.media.repository;

import com.openshelfrating.backend.media.domain.MediaResourceType;
import com.openshelfrating.backend.media.domain.MediaUpload;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MediaUploadRepository extends JpaRepository<MediaUpload, UUID> {

    Optional<MediaUpload> findFirstByResourceTypeAndResourceIdAndDeletedAtIsNullOrderByUploadedAtDesc(
            MediaResourceType resourceType,
            UUID resourceId
    );

    List<MediaUpload> findByResourceTypeAndResourceIdAndDeletedAtIsNull(MediaResourceType resourceType, UUID resourceId);
}
