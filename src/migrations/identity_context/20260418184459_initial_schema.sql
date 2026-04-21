-- Initial Schema for Identity Bounded Context
-- Creates users, roles, and permissions tables with appropriate relationships
-- Timestamp: 20260418184459


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
