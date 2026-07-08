package com.openshelfrating.backend.catalog.domain;

import com.openshelfrating.backend.auth.domain.UserAccount;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 17)
    private String isbn13;

    @Column(length = 10)
    private String isbn10;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "primary_author", nullable = false, length = 255)
    private String primaryAuthor;

    @Column(name = "normalized_title_author", nullable = false, length = 512)
    private String normalizedTitleAuthor;

    @ElementCollection
    @CollectionTable(name = "book_other_authors", joinColumns = @JoinColumn(name = "book_id"))
    @Column(name = "author_name", nullable = false, length = 255)
    private List<String> otherAuthors = new ArrayList<>();

    @Column(length = 255)
    private String publisher;

    @Column(name = "publication_date")
    private LocalDate publicationDate;

    private Integer pages;

    @Column(nullable = false, length = 5)
    private String language = "en";

    @ElementCollection(fetch = FetchType.EAGER, targetClass = BookGenre.class)
    @CollectionTable(name = "book_genres", joinColumns = @JoinColumn(name = "book_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "genre", nullable = false, length = 50)
    private Set<BookGenre> genres = new HashSet<>();

    @Column(name = "cover_url", length = 2048)
    private String coverUrl;

    @Column(length = 4000)
    private String synopsis;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private UserAccount createdBy;

    @Column(name = "is_canonical", nullable = false)
    private boolean canonical = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (language == null || language.isBlank()) {
            this.language = "en";
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public String getIsbn13() {
        return isbn13;
    }

    public void setIsbn13(String isbn13) {
        this.isbn13 = isbn13;
    }

    public String getIsbn10() {
        return isbn10;
    }

    public void setIsbn10(String isbn10) {
        this.isbn10 = isbn10;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPrimaryAuthor() {
        return primaryAuthor;
    }

    public void setPrimaryAuthor(String primaryAuthor) {
        this.primaryAuthor = primaryAuthor;
    }

    public String getNormalizedTitleAuthor() {
        return normalizedTitleAuthor;
    }

    public void setNormalizedTitleAuthor(String normalizedTitleAuthor) {
        this.normalizedTitleAuthor = normalizedTitleAuthor;
    }

    public List<String> getOtherAuthors() {
        return otherAuthors;
    }

    public void setOtherAuthors(List<String> otherAuthors) {
        this.otherAuthors = otherAuthors;
    }

    public String getPublisher() {
        return publisher;
    }

    public void setPublisher(String publisher) {
        this.publisher = publisher;
    }

    public LocalDate getPublicationDate() {
        return publicationDate;
    }

    public void setPublicationDate(LocalDate publicationDate) {
        this.publicationDate = publicationDate;
    }

    public Integer getPages() {
        return pages;
    }

    public void setPages(Integer pages) {
        this.pages = pages;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Set<BookGenre> getGenres() {
        return genres;
    }

    public void setGenres(Set<BookGenre> genres) {
        this.genres = genres;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public void setCoverUrl(String coverUrl) {
        this.coverUrl = coverUrl;
    }

    public String getSynopsis() {
        return synopsis;
    }

    public void setSynopsis(String synopsis) {
        this.synopsis = synopsis;
    }

    public UserAccount getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UserAccount createdBy) {
        this.createdBy = createdBy;
    }

    public boolean isCanonical() {
        return canonical;
    }

    public void setCanonical(boolean canonical) {
        this.canonical = canonical;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
