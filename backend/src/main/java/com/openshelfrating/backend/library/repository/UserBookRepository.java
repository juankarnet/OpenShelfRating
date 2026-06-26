package com.openshelfrating.backend.library.repository;

import com.openshelfrating.backend.library.domain.ReadingState;
import com.openshelfrating.backend.library.domain.UserBook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserBookRepository extends JpaRepository<UserBook, UUID> {

    Optional<UserBook> findByUserIdAndBookIdAndDeletedAtIsNull(UUID userId, UUID bookId);

    Optional<UserBook> findByUserIdAndBookIdAndDeletedAtIsNotNull(UUID userId, UUID bookId);

    Page<UserBook> findByUserIdAndDeletedAtIsNull(UUID userId, Pageable pageable);

    Page<UserBook> findByUserId(UUID userId, Pageable pageable);

    Page<UserBook> findByUserIdAndReadingStateAndDeletedAtIsNull(UUID userId, ReadingState readingState, Pageable pageable);

    Page<UserBook> findByUserIdAndReadingState(UUID userId, ReadingState readingState, Pageable pageable);

    long countByUserIdAndDeletedAtIsNull(UUID userId);

    long countByUserIdAndReadingStateAndDeletedAtIsNull(UUID userId, ReadingState readingState);

    @Query("""
            select distinct ub from UserBook ub
            left join ub.book.otherAuthors oa
            where ub.user.id = :userId
              and ub.deletedAt is null
              and (
                lower(ub.book.title) like lower(concat('%', :query, '%'))
                or lower(ub.book.primaryAuthor) like lower(concat('%', :query, '%'))
                or lower(oa) like lower(concat('%', :query, '%'))
              )
            """)
    Page<UserBook> searchActiveByUser(@Param("userId") UUID userId, @Param("query") String query, Pageable pageable);

    @Query("""
            select distinct ub from UserBook ub
            left join ub.book.otherAuthors oa
            where ub.user.id = :userId
              and (
                lower(ub.book.title) like lower(concat('%', :query, '%'))
                or lower(ub.book.primaryAuthor) like lower(concat('%', :query, '%'))
                or lower(oa) like lower(concat('%', :query, '%'))
              )
            """)
    Page<UserBook> searchAllByUser(@Param("userId") UUID userId, @Param("query") String query, Pageable pageable);
}
