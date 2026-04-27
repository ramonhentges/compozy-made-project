-- Up Migration

ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '';

-- Down Migration
ALTER TABLE users DROP COLUMN name;
