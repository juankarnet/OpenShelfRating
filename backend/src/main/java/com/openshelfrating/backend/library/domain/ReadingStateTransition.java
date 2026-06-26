package com.openshelfrating.backend.library.domain;

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
@Table(name = "reading_state_transitions")
public class ReadingStateTransition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_book_id", nullable = false)
    private UserBook userBook;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_state", length = 20)
    private ReadingState previousState;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_state", nullable = false, length = 20)
    private ReadingState newState;

    @Column(name = "transition_at", nullable = false)
    private OffsetDateTime transitionAt;

    @Column(name = "reason", length = 255)
    private String reason;

    @PrePersist
    void onCreate() {
        if (this.transitionAt == null) {
            this.transitionAt = OffsetDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public UserBook getUserBook() {
        return userBook;
    }

    public void setUserBook(UserBook userBook) {
        this.userBook = userBook;
    }

    public ReadingState getPreviousState() {
        return previousState;
    }

    public void setPreviousState(ReadingState previousState) {
        this.previousState = previousState;
    }

    public ReadingState getNewState() {
        return newState;
    }

    public void setNewState(ReadingState newState) {
        this.newState = newState;
    }

    public OffsetDateTime getTransitionAt() {
        return transitionAt;
    }

    public void setTransitionAt(OffsetDateTime transitionAt) {
        this.transitionAt = transitionAt;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
