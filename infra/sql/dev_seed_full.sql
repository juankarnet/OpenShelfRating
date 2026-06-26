BEGIN;

-- Deterministic dev users (extended dataset)
INSERT INTO users (id, email, password_hash, email_verified, display_name, role, avatar_url, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@openshelfrating.dev', '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa', TRUE, 'Admin Seed', 'ADMIN', 'avatars/00000000-0000-0000-0000-000000000001/seed-admin.jpg', NOW(), NOW()),
    ('11111111-1111-1111-1111-111111111111', 'alice@openshelfrating.dev', '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa', TRUE, 'Alice Reader', 'USER', 'avatars/11111111-1111-1111-1111-111111111111/seed-alice.jpg', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'bob@openshelfrating.dev', '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa', TRUE, 'Bob Reviewer', 'USER', NULL, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'carol@openshelfrating.dev', '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa', TRUE, 'Carol Librarian', 'USER', 'avatars/33333333-3333-3333-3333-333333333333/seed-carol.jpg', NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'diego@openshelfrating.dev', '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa', TRUE, 'Diego Collector', 'USER', NULL, NOW(), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'eva@openshelfrating.dev', '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa', TRUE, 'Eva Critic', 'USER', 'avatars/55555555-5555-5555-5555-555555555555/seed-eva.jpg', NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    email_verified = EXCLUDED.email_verified,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

-- Catalog books (10 records)
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
    ('dddddddd-dddd-dddd-dddd-ddddddddddd4', '9788491050290', NULL, 'El nombre de la rosa', 'Umberto Eco', 'el nombre de la rosa|umberto eco', 'OpenShelfRating Seed', '2016-01-01', 720, 'es', NULL, '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', '9780441172719', '0441172717', 'Dune', 'Frank Herbert', 'dune|frank herbert', 'OpenShelfRating Seed', '1990-09-01', 896, 'en', 'covers/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5/seed-dune.jpg', '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
    ('ffffffff-ffff-ffff-ffff-fffffffffff6', '9780307474728', NULL, 'Cien anos de soledad', 'Gabriel Garcia Marquez', 'cien anos de soledad|gabriel garcia marquez', 'OpenShelfRating Seed', '2006-02-21', 432, 'es', NULL, '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
    ('11111111-aaaa-bbbb-cccc-777777777777', '9780132350884', '0132350882', 'Clean Code', 'Robert C. Martin', 'clean code|robert c martin', 'OpenShelfRating Seed', '2008-08-01', 464, 'en', 'covers/11111111-aaaa-bbbb-cccc-777777777777/seed-clean-code.jpg', '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
    ('22222222-aaaa-bbbb-cccc-888888888888', '9780201616224', '020161622X', 'The Pragmatic Programmer', 'Andrew Hunt', 'the pragmatic programmer|andrew hunt', 'OpenShelfRating Seed', '1999-10-30', 352, 'en', 'covers/22222222-aaaa-bbbb-cccc-888888888888/seed-pragmatic.jpg', '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
    ('33333333-aaaa-bbbb-cccc-999999999999', '9780062316097', '0062316095', 'Sapiens', 'Yuval Noah Harari', 'sapiens|yuval noah harari', 'OpenShelfRating Seed', '2015-02-10', 512, 'en', NULL, '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),
    ('44444444-aaaa-bbbb-cccc-000000000000', '9788408172176', NULL, 'La sombra del viento', 'Carlos Ruiz Zafon', 'la sombra del viento|carlos ruiz zafon', 'OpenShelfRating Seed', '2017-06-01', 576, 'es', NULL, '00000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW())
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

DELETE FROM book_other_authors
WHERE book_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5',
    'ffffffff-ffff-ffff-ffff-fffffffffff6',
    '11111111-aaaa-bbbb-cccc-777777777777',
    '22222222-aaaa-bbbb-cccc-888888888888',
    '33333333-aaaa-bbbb-cccc-999999999999',
    '44444444-aaaa-bbbb-cccc-000000000000'
);

INSERT INTO book_other_authors (book_id, author_name)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Christopher Tolkien'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'Reg Keeland'),
    ('22222222-aaaa-bbbb-cccc-888888888888', 'David Thomas');

DELETE FROM book_genres
WHERE book_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5',
    'ffffffff-ffff-ffff-ffff-fffffffffff6',
    '11111111-aaaa-bbbb-cccc-777777777777',
    '22222222-aaaa-bbbb-cccc-888888888888',
    '33333333-aaaa-bbbb-cccc-999999999999',
    '44444444-aaaa-bbbb-cccc-000000000000'
);

INSERT INTO book_genres (book_id, genre)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'FANTASY'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'CLASSIC'),
    ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'THRILLER'),
    ('dddddddd-dddd-dddd-dddd-ddddddddddd4', 'MYSTERY'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'SCIENCE_FICTION'),
    ('ffffffff-ffff-ffff-ffff-fffffffffff6', 'MAGICAL_REALISM'),
    ('11111111-aaaa-bbbb-cccc-777777777777', 'NON_FICTION'),
    ('22222222-aaaa-bbbb-cccc-888888888888', 'NON_FICTION'),
    ('33333333-aaaa-bbbb-cccc-999999999999', 'HISTORY'),
    ('44444444-aaaa-bbbb-cccc-000000000000', 'MYSTERY');

INSERT INTO book_deduplication_keys (id, book_id, dedup_key, key_type, created_at)
VALUES
    ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '9780547928227', 'ISBN13', NOW()),
    ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0b1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'the hobbit|j r r tolkien', 'TITLE_AUTHOR', NOW()),
    ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '9780061120084', 'ISBN13', NOW()),
    ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0c2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'to kill a mockingbird|harper lee', 'TITLE_AUTHOR', NOW()),
    ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c3', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', '9780307474278', 'ISBN13', NOW()),
    ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0d3', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'the girl with the dragon tattoo|stieg larsson', 'TITLE_AUTHOR', NOW()),
    ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d4', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', '9788491050290', 'ISBN13', NOW()),
    ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0e4', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', 'el nombre de la rosa|umberto eco', 'TITLE_AUTHOR', NOW()),
    ('e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e5', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', '9780441172719', 'ISBN13', NOW()),
    ('e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0f5', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'dune|frank herbert', 'TITLE_AUTHOR', NOW()),
    ('f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f6', 'ffffffff-ffff-ffff-ffff-fffffffffff6', '9780307474728', 'ISBN13', NOW()),
    ('f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f106', 'ffffffff-ffff-ffff-ffff-fffffffffff6', 'cien anos de soledad|gabriel garcia marquez', 'TITLE_AUTHOR', NOW()),
    ('1111aaaa-0000-0000-0000-000000000777', '11111111-aaaa-bbbb-cccc-777777777777', '9780132350884', 'ISBN13', NOW()),
    ('1111aaaa-0000-0000-0000-000000000778', '11111111-aaaa-bbbb-cccc-777777777777', 'clean code|robert c martin', 'TITLE_AUTHOR', NOW()),
    ('2222aaaa-0000-0000-0000-000000000888', '22222222-aaaa-bbbb-cccc-888888888888', '9780201616224', 'ISBN13', NOW()),
    ('2222aaaa-0000-0000-0000-000000000889', '22222222-aaaa-bbbb-cccc-888888888888', 'the pragmatic programmer|andrew hunt', 'TITLE_AUTHOR', NOW()),
    ('3333aaaa-0000-0000-0000-000000000999', '33333333-aaaa-bbbb-cccc-999999999999', '9780062316097', 'ISBN13', NOW()),
    ('3333aaaa-0000-0000-0000-000000001000', '33333333-aaaa-bbbb-cccc-999999999999', 'sapiens|yuval noah harari', 'TITLE_AUTHOR', NOW()),
    ('4444aaaa-0000-0000-0000-000000001100', '44444444-aaaa-bbbb-cccc-000000000000', '9788408172176', 'ISBN13', NOW()),
    ('4444aaaa-0000-0000-0000-000000001101', '44444444-aaaa-bbbb-cccc-000000000000', 'la sombra del viento|carlos ruiz zafon', 'TITLE_AUTHOR', NOW())
ON CONFLICT (id) DO UPDATE
SET
    dedup_key = EXCLUDED.dedup_key,
    key_type = EXCLUDED.key_type,
    created_at = NOW();

DELETE FROM user_books
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
)
AND book_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5',
    'ffffffff-ffff-ffff-ffff-fffffffffff6',
    '11111111-aaaa-bbbb-cccc-777777777777',
    '22222222-aaaa-bbbb-cccc-888888888888',
    '33333333-aaaa-bbbb-cccc-999999999999',
    '44444444-aaaa-bbbb-cccc-000000000000'
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
    ('90000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-ddddddddddd4', 'READ', NOW() - INTERVAL '22 day', NOW() - INTERVAL '21 day', NOW() - INTERVAL '18 day', 4, 'Gran ambientacion historica.', NOW() - INTERVAL '18 day', NULL),
    ('90000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'READING', NOW() - INTERVAL '8 day', NOW() - INTERVAL '7 day', NULL, NULL, NULL, NULL, NULL),
    ('90000000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', '11111111-aaaa-bbbb-cccc-777777777777', 'READ', NOW() - INTERVAL '25 day', NOW() - INTERVAL '24 day', NOW() - INTERVAL '20 day', 5, 'Muy util para estandarizar estilos.', NOW() - INTERVAL '20 day', NULL),
    ('90000000-0000-0000-0000-000000000007', '44444444-4444-4444-4444-444444444444', '22222222-aaaa-bbbb-cccc-888888888888', 'PENDING', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL, NULL),
    ('90000000-0000-0000-0000-000000000008', '55555555-5555-5555-5555-555555555555', '33333333-aaaa-bbbb-cccc-999999999999', 'READ', NOW() - INTERVAL '30 day', NOW() - INTERVAL '29 day', NOW() - INTERVAL '23 day', 5, 'Perspectiva historica excelente.', NOW() - INTERVAL '23 day', NULL)
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
    ('91000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000004', 'READING', 'READ', NOW() - INTERVAL '18 day', 'seed'),
    ('91000000-0000-0000-0000-000000000006', '90000000-0000-0000-0000-000000000005', 'PENDING', 'READING', NOW() - INTERVAL '7 day', 'seed'),
    ('91000000-0000-0000-0000-000000000007', '90000000-0000-0000-0000-000000000006', 'PENDING', 'READING', NOW() - INTERVAL '24 day', 'seed'),
    ('91000000-0000-0000-0000-000000000008', '90000000-0000-0000-0000-000000000006', 'READING', 'READ', NOW() - INTERVAL '20 day', 'seed'),
    ('91000000-0000-0000-0000-000000000009', '90000000-0000-0000-0000-000000000008', 'PENDING', 'READING', NOW() - INTERVAL '29 day', 'seed'),
    ('91000000-0000-0000-0000-000000000010', '90000000-0000-0000-0000-000000000008', 'READING', 'READ', NOW() - INTERVAL '23 day', 'seed')
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
    'avatars/33333333-3333-3333-3333-333333333333/seed-carol.jpg',
    'avatars/55555555-5555-5555-5555-555555555555/seed-eva.jpg',
    'covers/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1/seed-hobbit.jpg',
    'covers/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2/seed-mockingbird.jpg',
    'covers/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5/seed-dune.jpg',
    'covers/11111111-aaaa-bbbb-cccc-777777777777/seed-clean-code.jpg',
    'covers/22222222-aaaa-bbbb-cccc-888888888888/seed-pragmatic.jpg'
);

INSERT INTO media_uploads (id, resource_type, resource_id, s3_path, mime_type, file_size, uploaded_at, deleted_at)
VALUES
    ('92000000-0000-0000-0000-000000000001', 'AVATAR', '00000000-0000-0000-0000-000000000001', 'avatars/00000000-0000-0000-0000-000000000001/seed-admin.jpg', 'image/jpeg', 10240, NOW() - INTERVAL '20 day', NULL),
    ('92000000-0000-0000-0000-000000000002', 'AVATAR', '11111111-1111-1111-1111-111111111111', 'avatars/11111111-1111-1111-1111-111111111111/seed-alice.jpg', 'image/jpeg', 8192, NOW() - INTERVAL '10 day', NULL),
    ('92000000-0000-0000-0000-000000000005', 'AVATAR', '33333333-3333-3333-3333-333333333333', 'avatars/33333333-3333-3333-3333-333333333333/seed-carol.jpg', 'image/jpeg', 9216, NOW() - INTERVAL '12 day', NULL),
    ('92000000-0000-0000-0000-000000000006', 'AVATAR', '55555555-5555-5555-5555-555555555555', 'avatars/55555555-5555-5555-5555-555555555555/seed-eva.jpg', 'image/jpeg', 9728, NOW() - INTERVAL '11 day', NULL),
    ('92000000-0000-0000-0000-000000000003', 'COVER', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'covers/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1/seed-hobbit.jpg', 'image/jpeg', 20480, NOW() - INTERVAL '7 day', NULL),
    ('92000000-0000-0000-0000-000000000004', 'COVER', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'covers/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2/seed-mockingbird.jpg', 'image/jpeg', 16384, NOW() - INTERVAL '7 day', NULL),
    ('92000000-0000-0000-0000-000000000007', 'COVER', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'covers/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5/seed-dune.jpg', 'image/jpeg', 21504, NOW() - INTERVAL '6 day', NULL),
    ('92000000-0000-0000-0000-000000000008', 'COVER', '11111111-aaaa-bbbb-cccc-777777777777', 'covers/11111111-aaaa-bbbb-cccc-777777777777/seed-clean-code.jpg', 'image/jpeg', 18432, NOW() - INTERVAL '6 day', NULL),
    ('92000000-0000-0000-0000-000000000009', 'COVER', '22222222-aaaa-bbbb-cccc-888888888888', 'covers/22222222-aaaa-bbbb-cccc-888888888888/seed-pragmatic.jpg', 'image/jpeg', 17664, NOW() - INTERVAL '6 day', NULL)
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
BEGIN;

-- Base deterministic users
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

-- Extra seed users (12)
WITH generated_users AS (
    SELECT
        gs,
        md5('seed-user-' || gs::text) AS h,
        CASE WHEN gs = 12 THEN FALSE ELSE TRUE END AS email_verified
    FROM generate_series(1, 12) gs
)
INSERT INTO users (id, email, password_hash, email_verified, display_name, role, avatar_url, created_at, updated_at)
SELECT
    (
        substr(h, 1, 8) || '-' ||
        substr(h, 9, 4) || '-' ||
        substr(h, 13, 4) || '-' ||
        substr(h, 17, 4) || '-' ||
        substr(h, 21, 12)
    )::uuid,
    'seed.user' || gs || '@openshelfrating.dev',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOePaWxn96p36L4zQ4EJrjM7D8R7Y4mGa',
    email_verified,
    'Seed User ' || gs,
    'USER',
    CASE WHEN gs % 2 = 0 THEN 'avatars/seed-users/' || gs || '.jpg' ELSE NULL END,
    NOW(),
    NOW()
FROM generated_users
ON CONFLICT (email) DO UPDATE
SET
    display_name = EXCLUDED.display_name,
    email_verified = EXCLUDED.email_verified,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

-- Core books
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

-- Extra seed books (24)
WITH generated_books AS (
    SELECT
        gs,
        md5('seed-book-' || gs::text) AS h,
        'Seed Book ' || lpad(gs::text, 2, '0') AS title,
        'Seed Author ' || ((gs % 7) + 1) AS author_name
    FROM generate_series(1, 24) gs
)
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
SELECT
    (
        substr(h, 1, 8) || '-' ||
        substr(h, 9, 4) || '-' ||
        substr(h, 13, 4) || '-' ||
        substr(h, 17, 4) || '-' ||
        substr(h, 21, 12)
    )::uuid,
    NULL,
    NULL,
    '[SEED] ' || title,
    author_name,
    lower('[seed] ' || title || '|' || author_name),
    'OpenShelfRating Seed',
    (DATE '2010-01-01' + (gs * 30)),
    120 + (gs * 10),
    CASE WHEN gs % 3 = 0 THEN 'es' ELSE 'en' END,
    CASE WHEN gs % 4 = 0 THEN 'covers/seed-books/' || gs || '.jpg' ELSE NULL END,
    '00000000-0000-0000-0000-000000000001',
    TRUE,
    NOW(),
    NOW()
FROM generated_books
ON CONFLICT (id) DO UPDATE
SET
    title = EXCLUDED.title,
    primary_author = EXCLUDED.primary_author,
    normalized_title_author = EXCLUDED.normalized_title_author,
    publisher = EXCLUDED.publisher,
    publication_date = EXCLUDED.publication_date,
    pages = EXCLUDED.pages,
    language = EXCLUDED.language,
    cover_url = EXCLUDED.cover_url,
    updated_at = NOW();

-- Normalize many-to-many rows for all seed books
DELETE FROM book_other_authors
WHERE book_id IN (
    SELECT id FROM books WHERE publisher = 'OpenShelfRating Seed'
);

INSERT INTO book_other_authors (book_id, author_name)
SELECT id, 'Seed Coauthor'
FROM books
WHERE publisher = 'OpenShelfRating Seed'
  AND (extract(day from created_at)::int % 2 = 0)
ON CONFLICT DO NOTHING;

DELETE FROM book_genres
WHERE book_id IN (
    SELECT id FROM books WHERE publisher = 'OpenShelfRating Seed'
);

INSERT INTO book_genres (book_id, genre)
SELECT
    id,
    CASE
        WHEN row_number() OVER (ORDER BY id) % 4 = 0 THEN 'FANTASY'
        WHEN row_number() OVER (ORDER BY id) % 4 = 1 THEN 'CLASSIC'
        WHEN row_number() OVER (ORDER BY id) % 4 = 2 THEN 'THRILLER'
        ELSE 'MYSTERY'
    END
FROM books
WHERE publisher = 'OpenShelfRating Seed';

DELETE FROM book_deduplication_keys
WHERE book_id IN (
    SELECT id FROM books WHERE publisher = 'OpenShelfRating Seed'
);

INSERT INTO book_deduplication_keys (id, book_id, dedup_key, key_type, created_at)
SELECT
    (
        substr(md5('seed-dedup-' || b.id::text), 1, 8) || '-' ||
        substr(md5('seed-dedup-' || b.id::text), 9, 4) || '-' ||
        substr(md5('seed-dedup-' || b.id::text), 13, 4) || '-' ||
        substr(md5('seed-dedup-' || b.id::text), 17, 4) || '-' ||
        substr(md5('seed-dedup-' || b.id::text), 21, 12)
    )::uuid,
    b.id,
    b.normalized_title_author,
    'TITLE_AUTHOR',
    NOW()
FROM books b
WHERE b.publisher = 'OpenShelfRating Seed'
ON CONFLICT (id) DO UPDATE
SET
    dedup_key = EXCLUDED.dedup_key,
    key_type = EXCLUDED.key_type,
    created_at = NOW();

-- Reset existing seed user_books for reproducibility
DELETE FROM user_books
WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@openshelfrating.dev'
)
AND book_id IN (
    SELECT id FROM books WHERE publisher = 'OpenShelfRating Seed'
);

-- Create 72 library entries from seed users x seed books
WITH seed_users AS (
    SELECT id, row_number() OVER (ORDER BY email) AS rn
    FROM users
    WHERE email LIKE '%@openshelfrating.dev'
),
seed_books AS (
    SELECT id, row_number() OVER (ORDER BY title) AS rn
    FROM books
    WHERE publisher = 'OpenShelfRating Seed'
),
pairs AS (
    SELECT
        su.id AS user_id,
        sb.id AS book_id,
        row_number() OVER (ORDER BY su.rn, sb.rn) AS pair_rn
    FROM seed_users su
    CROSS JOIN seed_books sb
    WHERE ((su.rn + sb.rn) % 3) <> 0
    LIMIT 72
)
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
SELECT
    (
        substr(md5('seed-user-book-' || pair_rn::text), 1, 8) || '-' ||
        substr(md5('seed-user-book-' || pair_rn::text), 9, 4) || '-' ||
        substr(md5('seed-user-book-' || pair_rn::text), 13, 4) || '-' ||
        substr(md5('seed-user-book-' || pair_rn::text), 17, 4) || '-' ||
        substr(md5('seed-user-book-' || pair_rn::text), 21, 12)
    )::uuid,
    user_id,
    book_id,
    CASE
        WHEN pair_rn % 3 = 0 THEN 'READ'
        WHEN pair_rn % 3 = 1 THEN 'READING'
        ELSE 'PENDING'
    END,
    NOW() - ((pair_rn + 10) || ' day')::interval,
    CASE WHEN pair_rn % 3 IN (0, 1) THEN NOW() - ((pair_rn + 8) || ' day')::interval ELSE NULL END,
    CASE WHEN pair_rn % 3 = 0 THEN NOW() - ((pair_rn + 3) || ' day')::interval ELSE NULL END,
    CASE WHEN pair_rn % 3 = 0 THEN ((pair_rn % 5) + 1) ELSE NULL END,
    CASE WHEN pair_rn % 3 = 0 THEN 'Seed review ' || pair_rn ELSE NULL END,
    CASE WHEN pair_rn % 3 = 0 THEN NOW() - ((pair_rn + 3) || ' day')::interval ELSE NULL END,
    NULL
FROM pairs
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

-- Refresh transitions for seed user_books
DELETE FROM reading_state_transitions
WHERE reason IN ('seed', 'seed-full');

INSERT INTO reading_state_transitions (id, user_book_id, previous_state, new_state, transition_at, reason)
SELECT
    (
        substr(md5('seed-transition-a-' || ub.id::text), 1, 8) || '-' ||
        substr(md5('seed-transition-a-' || ub.id::text), 9, 4) || '-' ||
        substr(md5('seed-transition-a-' || ub.id::text), 13, 4) || '-' ||
        substr(md5('seed-transition-a-' || ub.id::text), 17, 4) || '-' ||
        substr(md5('seed-transition-a-' || ub.id::text), 21, 12)
    )::uuid,
    ub.id,
    'PENDING',
    'READING',
    COALESCE(ub.started_reading_at, ub.added_at + INTERVAL '1 day'),
    'seed-full'
FROM user_books ub
JOIN users u ON u.id = ub.user_id
WHERE u.email LIKE '%@openshelfrating.dev'
  AND ub.reading_state IN ('READING', 'READ')
ON CONFLICT (id) DO UPDATE
SET
    previous_state = EXCLUDED.previous_state,
    new_state = EXCLUDED.new_state,
    transition_at = EXCLUDED.transition_at,
    reason = EXCLUDED.reason;

INSERT INTO reading_state_transitions (id, user_book_id, previous_state, new_state, transition_at, reason)
SELECT
    (
        substr(md5('seed-transition-b-' || ub.id::text), 1, 8) || '-' ||
        substr(md5('seed-transition-b-' || ub.id::text), 9, 4) || '-' ||
        substr(md5('seed-transition-b-' || ub.id::text), 13, 4) || '-' ||
        substr(md5('seed-transition-b-' || ub.id::text), 17, 4) || '-' ||
        substr(md5('seed-transition-b-' || ub.id::text), 21, 12)
    )::uuid,
    ub.id,
    'READING',
    'READ',
    COALESCE(ub.completed_reading_at, ub.started_reading_at + INTERVAL '3 day'),
    'seed-full'
FROM user_books ub
JOIN users u ON u.id = ub.user_id
WHERE u.email LIKE '%@openshelfrating.dev'
  AND ub.reading_state = 'READ'
ON CONFLICT (id) DO UPDATE
SET
    previous_state = EXCLUDED.previous_state,
    new_state = EXCLUDED.new_state,
    transition_at = EXCLUDED.transition_at,
    reason = EXCLUDED.reason;

-- Refresh media metadata for seed entities
DELETE FROM media_uploads
WHERE
    (resource_type = 'AVATAR' AND resource_id IN (SELECT id FROM users WHERE email LIKE '%@openshelfrating.dev'))
    OR
    (resource_type = 'COVER' AND resource_id IN (SELECT id FROM books WHERE publisher = 'OpenShelfRating Seed'));

INSERT INTO media_uploads (id, resource_type, resource_id, s3_path, mime_type, file_size, uploaded_at, deleted_at)
SELECT
    (
        substr(md5('seed-avatar-upload-' || u.id::text), 1, 8) || '-' ||
        substr(md5('seed-avatar-upload-' || u.id::text), 9, 4) || '-' ||
        substr(md5('seed-avatar-upload-' || u.id::text), 13, 4) || '-' ||
        substr(md5('seed-avatar-upload-' || u.id::text), 17, 4) || '-' ||
        substr(md5('seed-avatar-upload-' || u.id::text), 21, 12)
    )::uuid,
    'AVATAR',
    u.id,
    COALESCE(u.avatar_url, 'avatars/seed-users/default-' || row_number() OVER (ORDER BY u.id) || '.jpg'),
    'image/jpeg',
    8192,
    NOW() - INTERVAL '5 day',
    NULL
FROM users u
WHERE u.email LIKE '%@openshelfrating.dev'
  AND u.avatar_url IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
    s3_path = EXCLUDED.s3_path,
    mime_type = EXCLUDED.mime_type,
    file_size = EXCLUDED.file_size,
    uploaded_at = EXCLUDED.uploaded_at,
    deleted_at = EXCLUDED.deleted_at;

INSERT INTO media_uploads (id, resource_type, resource_id, s3_path, mime_type, file_size, uploaded_at, deleted_at)
SELECT
    (
        substr(md5('seed-cover-upload-' || b.id::text), 1, 8) || '-' ||
        substr(md5('seed-cover-upload-' || b.id::text), 9, 4) || '-' ||
        substr(md5('seed-cover-upload-' || b.id::text), 13, 4) || '-' ||
        substr(md5('seed-cover-upload-' || b.id::text), 17, 4) || '-' ||
        substr(md5('seed-cover-upload-' || b.id::text), 21, 12)
    )::uuid,
    'COVER',
    b.id,
    b.cover_url,
    'image/jpeg',
    16384,
    NOW() - INTERVAL '4 day',
    NULL
FROM books b
WHERE b.publisher = 'OpenShelfRating Seed'
  AND b.cover_url IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
    s3_path = EXCLUDED.s3_path,
    mime_type = EXCLUDED.mime_type,
    file_size = EXCLUDED.file_size,
    uploaded_at = EXCLUDED.uploaded_at,
    deleted_at = EXCLUDED.deleted_at;

COMMIT;
