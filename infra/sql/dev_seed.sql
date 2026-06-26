BEGIN;

-- Deterministic dev users
INSERT INTO users (id, email, password_hash, email_verified, display_name, role, avatar_url, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@openshelfrating.dev', '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa', TRUE, 'Admin Seed', 'ADMIN', 'avatars/00000000-0000-0000-0000-000000000001/seed-admin.jpg', NOW(), NOW()),
    ('11111111-1111-1111-1111-111111111111', 'alice@openshelfrating.dev', '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa', TRUE, 'Alice Reader', 'USER', 'avatars/11111111-1111-1111-1111-111111111111/seed-alice.jpg', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'bob@openshelfrating.dev', '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa', TRUE, 'Bob Reviewer', 'USER', NULL, NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    email_verified = EXCLUDED.email_verified,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

-- Catalog books
INSERT INTO books (
    id,
    isbn13,
    isbn10,
    title,
    primary_author,
    normalized_title_author,
    publisher,
    publication_date,
    pages,
    language,
    cover_url,
    created_by,
    is_canonical,
    created_at,
    updated_at
)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '9780547928227', '054792822X', 'The Hobbit', 'J. R. R. Tolkien', 'the hobbit|j r r tolkien', 'OpenShelfRating Seed', '2012-09-18', 300, 'en', 'covers/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1/seed-hobbit.jpg', '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '9780061120084', '0061120081', 'To Kill a Mockingbird', 'Harper Lee', 'to kill a mockingbird|harper lee', 'OpenShelfRating Seed', '2006-05-23', 336, 'en', 'covers/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2/seed-mockingbird.jpg', '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '9780307474278', '0307474275', 'The Girl with the Dragon Tattoo', 'Stieg Larsson', 'the girl with the dragon tattoo|stieg larsson', 'OpenShelfRating Seed', '2009-05-26', 672, 'en', NULL, '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd4', '9788491050290', NULL, 'El nombre de la rosa', 'Umberto Eco', 'el nombre de la rosa|umberto eco', 'OpenShelfRating Seed', '2016-01-01', 720, 'es', NULL, '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET
    isbn13 = EXCLUDED.isbn13,
    isbn10 = EXCLUDED.isbn10,
    title = EXCLUDED.title,
    primary_author = EXCLUDED.primary_author,
    normalized_title_author = EXCLUDED.normalized_title_author,
    publisher = EXCLUDED.publisher,
    publication_date = EXCLUDED.publication_date,
    pages = EXCLUDED.pages,
    language = EXCLUDED.language,
    cover_url = EXCLUDED.cover_url,
    created_by = EXCLUDED.created_by,
    is_canonical = EXCLUDED.is_canonical,
    updated_at = NOW();

-- Normalize many-to-many related seed rows
DELETE FROM book_other_authors
WHERE book_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd4'
);

INSERT INTO book_other_authors (book_id, author_name)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Christopher Tolkien'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'Reg Keeland');

DELETE FROM book_genres
WHERE book_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd4'
);

INSERT INTO book_genres (book_id, genre)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'FANTASY'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'CLASSIC'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'THRILLER'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd4', 'MYSTERY');

INSERT INTO book_deduplication_keys (id, book_id, dedup_key, key_type, created_at)
VALUES
    ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '9780547928227', 'ISBN13', NOW()),
    ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0b1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'the hobbit|j r r tolkien', 'TITLE_AUTHOR', NOW()),
    ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '9780061120084', 'ISBN13', NOW()),
    ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0c2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'to kill a mockingbird|harper lee', 'TITLE_AUTHOR', NOW()),
    ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c3', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', '9780307474278', 'ISBN13', NOW()),
    ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0d3', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'the girl with the dragon tattoo|stieg larsson', 'TITLE_AUTHOR', NOW()),
    ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d4', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', '9788491050290', 'ISBN13', NOW()),
    ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0e4', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', 'el nombre de la rosa|umberto eco', 'TITLE_AUTHOR', NOW())
ON CONFLICT (id) DO UPDATE
SET
    dedup_key = EXCLUDED.dedup_key,
    key_type = EXCLUDED.key_type,
    created_at = NOW();

-- Replace seed library rows (and cascade transitions)
DELETE FROM user_books
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
)
AND book_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd4'
);

INSERT INTO user_books (
    id,
    user_id,
    book_id,
    reading_state,
    added_at,
    started_reading_at,
    completed_reading_at,
    rating,
    opinion,
    review_updated_at,
    deleted_at
)
VALUES
    ('90000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'READ', NOW() - INTERVAL '15 day', NOW() - INTERVAL '14 day', NOW() - INTERVAL '9 day', 5, 'Relectura obligatoria cada anio.', NOW() - INTERVAL '9 day', NULL),
    ('90000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'READING', NOW() - INTERVAL '6 day', NOW() - INTERVAL '5 day', NULL, NULL, NULL, NULL, NULL),
    ('90000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'PENDING', NOW() - INTERVAL '2 day', NULL, NULL, NULL, NULL, NULL, NULL),
    ('90000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', 'READ', NOW() - INTERVAL '22 day', NOW() - INTERVAL '21 day', NOW() - INTERVAL '18 day', 4, 'Gran ambientacion historica.', NOW() - INTERVAL '18 day', NULL)
ON CONFLICT (id) DO UPDATE
SET
    reading_state = EXCLUDED.reading_state,
    added_at = EXCLUDED.added_at,
    started_reading_at = EXCLUDED.started_reading_at,
    completed_reading_at = EXCLUDED.completed_reading_at,
    rating = EXCLUDED.rating,
    opinion = EXCLUDED.opinion,
    review_updated_at = EXCLUDED.review_updated_at,
    deleted_at = EXCLUDED.deleted_at;

INSERT INTO reading_state_transitions (id, user_book_id, previous_state, new_state, transition_at, reason)
VALUES
    ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'PENDING', 'READING', NOW() - INTERVAL '14 day', 'seed'),
    ('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', 'READING', 'READ', NOW() - INTERVAL '9 day', 'seed'),
    ('91000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000002', 'PENDING', 'READING', NOW() - INTERVAL '5 day', 'seed'),
    ('91000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000004', 'PENDING', 'READING', NOW() - INTERVAL '21 day', 'seed'),
    ('91000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000004', 'READING', 'READ', NOW() - INTERVAL '18 day', 'seed')
ON CONFLICT (id) DO UPDATE
SET
    previous_state = EXCLUDED.previous_state,
    new_state = EXCLUDED.new_state,
    transition_at = EXCLUDED.transition_at,
    reason = EXCLUDED.reason;

DELETE FROM media_uploads
WHERE s3_path IN (
    'avatars/00000000-0000-0000-0000-000000000001/seed-admin.jpg',
    'avatars/11111111-1111-1111-1111-111111111111/seed-alice.jpg',
    'covers/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1/seed-hobbit.jpg',
    'covers/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2/seed-mockingbird.jpg'
);

INSERT INTO media_uploads (id, resource_type, resource_id, s3_path, mime_type, file_size, uploaded_at, deleted_at)
VALUES
    ('92000000-0000-0000-0000-000000000001', 'AVATAR', '00000000-0000-0000-0000-000000000001', 'avatars/00000000-0000-0000-0000-000000000001/seed-admin.jpg', 'image/jpeg', 10240, NOW() - INTERVAL '20 day', NULL),
    ('92000000-0000-0000-0000-000000000002', 'AVATAR', '11111111-1111-1111-1111-111111111111', 'avatars/11111111-1111-1111-1111-111111111111/seed-alice.jpg', 'image/jpeg', 8192, NOW() - INTERVAL '10 day', NULL),
    ('92000000-0000-0000-0000-000000000003', 'COVER', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'covers/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1/seed-hobbit.jpg', 'image/jpeg', 20480, NOW() - INTERVAL '7 day', NULL),
    ('92000000-0000-0000-0000-000000000004', 'COVER', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'covers/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2/seed-mockingbird.jpg', 'image/jpeg', 16384, NOW() - INTERVAL '7 day', NULL)
ON CONFLICT (id) DO UPDATE
SET
    resource_type = EXCLUDED.resource_type,
    resource_id = EXCLUDED.resource_id,
    s3_path = EXCLUDED.s3_path,
    mime_type = EXCLUDED.mime_type,
    file_size = EXCLUDED.file_size,
    uploaded_at = EXCLUDED.uploaded_at,
    deleted_at = EXCLUDED.deleted_at;

COMMIT;
