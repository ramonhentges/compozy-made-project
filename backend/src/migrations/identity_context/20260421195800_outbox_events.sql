-- Up Migration

CREATE TABLE IF NOT EXISTS events (
    id uuid PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_version INTEGER NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_error TEXT NULL,
    occurred_on TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processing_started_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    CONSTRAINT events_status_check CHECK (status IN ('pending', 'processing', 'published', 'failed'))
);

-- Indexes for relay polling and operational investigation
CREATE INDEX IF NOT EXISTS idx_events_status_next_attempt_at ON events(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_events_aggregate ON events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name_version ON events(event_name, event_version);

-- Down Migration

DROP INDEX IF EXISTS idx_events_event_name_version;
DROP INDEX IF EXISTS idx_events_aggregate;
DROP INDEX IF EXISTS idx_events_status_next_attempt_at;

DROP TABLE IF EXISTS events;
