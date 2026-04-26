-- Add name column to users table
-- Timestamp: 20260425120000

ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '';