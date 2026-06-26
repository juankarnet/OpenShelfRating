CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY,
    isbn13 VARCHAR(17),
    isbn10 VARCHAR(10),
    title VARCHAR(255) NOT NULL,
    primary_author VARCHAR(255) NOT NULL,
    normalized_title_author VARCHAR(512) NOT NULL,
    publisher VARCHAR(255),
    publication_date DATE,
    pages INT,
    language VARCHAR(5) NOT NULL DEFAULT 'en',
    cover_url VARCHAR(2048),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_canonical BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS book_other_authors (
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS book_genres (
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    genre VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS book_deduplication_keys (
    id UUID PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    dedup_key VARCHAR(500) NOT NULL,
    key_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_books_isbn13
    ON books (isbn13)
    WHERE isbn13 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_books_normalized_title_author
    ON books (normalized_title_author);

CREATE INDEX IF NOT EXISTS idx_books_isbn10 ON books (isbn10);
CREATE INDEX IF NOT EXISTS idx_books_title ON books USING gin (to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_books_primary_author ON books USING gin (to_tsvector('simple', primary_author));
CREATE INDEX IF NOT EXISTS idx_books_canonical ON books (is_canonical);
CREATE INDEX IF NOT EXISTS idx_books_created_by ON books (created_by);
CREATE INDEX IF NOT EXISTS idx_book_dedup_keys_book_id ON book_deduplication_keys (book_id);
CREATE INDEX IF NOT EXISTS idx_book_dedup_keys_key ON book_deduplication_keys (dedup_key);
