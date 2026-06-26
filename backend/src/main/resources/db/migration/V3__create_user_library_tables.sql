CREATE TABLE IF NOT EXISTS user_books (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    reading_state VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    added_at TIMESTAMPTZ NOT NULL,
    started_reading_at TIMESTAMPTZ,
    completed_reading_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_books_active_user_book
    ON user_books(user_id, book_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_books_user_id_deleted_at
    ON user_books(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_user_books_user_state_deleted_at
    ON user_books(user_id, reading_state, deleted_at);

CREATE INDEX IF NOT EXISTS idx_user_books_book_id
    ON user_books(book_id);
