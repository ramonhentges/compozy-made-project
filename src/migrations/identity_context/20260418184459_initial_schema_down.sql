-- Rollback Initial Schema for Identity Bounded Context
-- Drops all tables created by initial schema migration
-- Timestamp: 20260418184459

-- Drop main tables
DROP TABLE IF EXISTS users;

-- Indexes are automatically dropped when tables are dropped