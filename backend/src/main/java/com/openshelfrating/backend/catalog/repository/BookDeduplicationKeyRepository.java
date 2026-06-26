package com.openshelfrating.backend.catalog.repository;

import com.openshelfrating.backend.catalog.domain.BookDeduplicationKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BookDeduplicationKeyRepository extends JpaRepository<BookDeduplicationKey, UUID> {

    List<BookDeduplicationKey> findByBookId(UUID bookId);
}
