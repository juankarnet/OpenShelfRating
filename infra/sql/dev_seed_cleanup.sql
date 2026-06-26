BEGIN;

-- Remove transitions first to keep deletion order explicit
DELETE FROM reading_state_transitions
WHERE reason = 'seed'
   OR user_book_id IN (
       SELECT ub.id
       FROM user_books ub
       JOIN users u ON u.id = ub.user_id
       WHERE u.email LIKE '%@openshelfrating.dev'
   );

-- Remove user library rows linked to seed users
DELETE FROM user_books
WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@openshelfrating.dev'
);

-- Remove media metadata associated with seed users or seed books
DELETE FROM media_uploads
WHERE
    (resource_type = 'AVATAR' AND resource_id IN (
        SELECT id FROM users WHERE email LIKE '%@openshelfrating.dev'
    ))
    OR
    (resource_type = 'COVER' AND resource_id IN (
        SELECT id FROM books
        WHERE publisher = 'OpenShelfRating Seed'
           OR created_by IN (SELECT id FROM users WHERE email LIKE '%@openshelfrating.dev')
    ));

-- Remove many-to-many links for seed books
DELETE FROM book_other_authors
WHERE book_id IN (
    SELECT id FROM books
    WHERE publisher = 'OpenShelfRating Seed'
       OR created_by IN (SELECT id FROM users WHERE email LIKE '%@openshelfrating.dev')
);

DELETE FROM book_genres
WHERE book_id IN (
    SELECT id FROM books
    WHERE publisher = 'OpenShelfRating Seed'
       OR created_by IN (SELECT id FROM users WHERE email LIKE '%@openshelfrating.dev')
);

DELETE FROM book_deduplication_keys
WHERE book_id IN (
    SELECT id FROM books
    WHERE publisher = 'OpenShelfRating Seed'
       OR created_by IN (SELECT id FROM users WHERE email LIKE '%@openshelfrating.dev')
);

-- Remove seed books
DELETE FROM books
WHERE publisher = 'OpenShelfRating Seed'
   OR created_by IN (SELECT id FROM users WHERE email LIKE '%@openshelfrating.dev');

-- Finally remove seed users and verification tokens
DELETE FROM users
WHERE email LIKE '%@openshelfrating.dev';

COMMIT;
