CREATE TABLE IF NOT EXISTS media_uploads (
    id UUID PRIMARY KEY,
    resource_type VARCHAR(20) NOT NULL,
    resource_id UUID NOT NULL,
    s3_path VARCHAR(2048) NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    UNIQUE(s3_path)
);

CREATE INDEX IF NOT EXISTS idx_media_resource
    ON media_uploads(resource_type, resource_id, deleted_at, uploaded_at DESC);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(2048);

CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url);
