-- Rollback Add Name Column for Identity Bounded Context
-- Removes the name column from users table
-- Timestamp: 20260425120000

ALTER TABLE users DROP COLUMN IF EXISTS name;
