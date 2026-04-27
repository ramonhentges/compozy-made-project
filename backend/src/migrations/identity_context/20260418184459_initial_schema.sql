-- Up Migration

-- Users table (core authentication entity)
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_unique UNIQUE (email)
);


-- Indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Down Migration

-- Drop main tables
DROP TABLE IF EXISTS users;

-- Indexes are automatically dropped when tables are dropped