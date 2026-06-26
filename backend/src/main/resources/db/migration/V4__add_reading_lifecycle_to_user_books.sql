ALTER TABLE user_books
    ADD COLUMN IF NOT EXISTS rating INT,
    ADD COLUMN IF NOT EXISTS opinion VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS review_updated_at TIMESTAMPTZ;

ALTER TABLE user_books
    DROP CONSTRAINT IF EXISTS chk_user_books_rating_range;

ALTER TABLE user_books
    ADD CONSTRAINT chk_user_books_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

CREATE TABLE IF NOT EXISTS reading_state_transitions (
    id UUID PRIMARY KEY,
    user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    previous_state VARCHAR(20),
    new_state VARCHAR(20) NOT NULL,
    transition_at TIMESTAMPTZ NOT NULL,
    reason VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_state_transitions_userbook
    ON reading_state_transitions(user_book_id);
