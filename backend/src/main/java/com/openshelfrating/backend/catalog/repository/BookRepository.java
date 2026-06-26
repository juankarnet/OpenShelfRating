package com.openshelfrating.backend.catalog.repository;

import com.openshelfrating.backend.catalog.domain.Book;
import com.openshelfrating.backend.catalog.domain.BookGenre;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookRepository extends JpaRepository<Book, UUID> {

    Optional<Book> findByIsbn13(String isbn13);

    Optional<Book> findByNormalizedTitleAuthor(String normalizedTitleAuthor);

    Page<Book> findAllByCanonicalTrue(Pageable pageable);

    @Query("""
            select distinct b from Book b
            left join b.otherAuthors oa
            where b.canonical = true and (
                lower(b.title) like lower(concat('%', :textQuery, '%'))
                or lower(b.primaryAuthor) like lower(concat('%', :textQuery, '%'))
                or lower(oa) like lower(concat('%', :textQuery, '%'))
                or b.isbn13 = :exactQuery
                or b.isbn10 = :exactQuery
            )
            """)
    Page<Book> searchCanonical(@Param("textQuery") String textQuery, @Param("exactQuery") String exactQuery, Pageable pageable);

    @Query("select b.language, count(b) from Book b where b.canonical = true group by b.language")
    List<Object[]> countCanonicalByLanguage();

    @Query("select g, count(b) from Book b join b.genres g where b.canonical = true group by g")
    List<Object[]> countCanonicalByGenre();

    long countByCanonicalTrue();
}
