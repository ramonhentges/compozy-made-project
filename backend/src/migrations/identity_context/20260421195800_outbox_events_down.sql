-- Rollback Outbox Events for Identity Bounded Context
-- Drops only the outbox table and indexes created by the outbox migration
-- Timestamp: 20260421195800

DROP INDEX IF EXISTS idx_events_event_name_version;
DROP INDEX IF EXISTS idx_events_aggregate;
DROP INDEX IF EXISTS idx_events_status_next_attempt_at;

DROP TABLE IF EXISTS events;
