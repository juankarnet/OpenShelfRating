package com.openshelfrating.backend.library.domain;

import com.openshelfrating.backend.auth.domain.UserAccount;
import com.openshelfrating.backend.catalog.domain.Book;
import jakarta.persistence.Column;
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
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_books")
public class UserBook {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Enumerated(EnumType.STRING)
    @Column(name = "reading_state", nullable = false, length = 20)
    private ReadingState readingState = ReadingState.PENDING;

    @Column(name = "added_at", nullable = false)
    private OffsetDateTime addedAt;

    @Column(name = "started_reading_at")
    private OffsetDateTime startedReadingAt;

    @Column(name = "completed_reading_at")
    private OffsetDateTime completedReadingAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @PrePersist
    void onCreate() {
        if (this.addedAt == null) {
            this.addedAt = OffsetDateTime.now();
        }
        if (this.readingState == null) {
            this.readingState = ReadingState.PENDING;
        }
    }

    public UUID getId() {
        return id;
    }

    public UserAccount getUser() {
        return user;
    }

    public void setUser(UserAccount user) {
        this.user = user;
    }

    public Book getBook() {
        return book;
    }

    public void setBook(Book book) {
        this.book = book;
    }

    public ReadingState getReadingState() {
        return readingState;
    }

    public void setReadingState(ReadingState readingState) {
        this.readingState = readingState;
    }

    public OffsetDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(OffsetDateTime addedAt) {
        this.addedAt = addedAt;
    }

    public OffsetDateTime getStartedReadingAt() {
        return startedReadingAt;
    }

    public void setStartedReadingAt(OffsetDateTime startedReadingAt) {
        this.startedReadingAt = startedReadingAt;
    }

    public OffsetDateTime getCompletedReadingAt() {
        return completedReadingAt;
    }

    public void setCompletedReadingAt(OffsetDateTime completedReadingAt) {
        this.completedReadingAt = completedReadingAt;
    }

    public OffsetDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(OffsetDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }
}
