# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

## Shared Decisions
- In-process relay uses `FOR UPDATE SKIP LOCKED` for safe concurrent claiming.
- Relay logs use `console.log` with event name + JSON stringified structured fields, not raw payload.
- Error redaction uses regex patterns to redact sensitive strings before logging.

## Shared Learnings
- Outbox SQL helper serializes payloads with `JSON.stringify` and casts `$6::jsonb`; this preserves JSON `null` for `PasswordChanged` without sending SQL NULL into the migration's `payload JSONB NOT NULL` column.
- `AggregateRoot` now exposes `getDomainEvents()` for non-clearing event inspection; repositories should still call `pullDomainEvents()` only after successful persistence work.
- `OutboxRelayConfig` is defined in `src/config/index.ts` as `OutboxRelayConfig` interface with pollIntervalMs, batchSize, maxAttempts, backoffBaseMs, backoffMaxMs.

## Open Risks
- Database-backed repository integration tests are gated by `IDENTITY_REPOSITORY_TEST_DATABASE_URL`; environments without a reachable Postgres instance will skip those tests.

## Handoffs
