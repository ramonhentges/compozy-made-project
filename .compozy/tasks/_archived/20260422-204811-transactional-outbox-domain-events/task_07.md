---
status: completed
title: Add outbox relay claiming, publishing, retry, and status transitions
type: backend
complexity: high
dependencies:
  - task_02
  - task_06
---

# Task 7: Add outbox relay claiming, publishing, retry, and status transitions

## Overview
Add the in-process relay that polls due outbox records, publishes them through the configured publisher, and records delivery status. This implements V1 asynchronous at-least-once delivery with retry recovery and basic operational visibility.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST claim due `pending` records in bounded batches using transactional database behavior.
- MUST transition claimed records to `processing` before publishing.
- MUST mark successfully published records as `published` with `published_at`.
- MUST reschedule transient publish failures with attempts, next attempt time, and last error.
- MUST mark records `failed` after the configured maximum attempt count.
- MUST log status transitions with event IDs and status fields without logging full payloads.
- MUST support start and stop operations for in-process lifecycle management.
</requirements>

## Subtasks
- [x] 7.1 Add outbox repository operations for claiming due records and updating statuses.
- [x] 7.2 Add relay loop start and stop behavior.
- [x] 7.3 Add publish-success status handling.
- [x] 7.4 Add retry scheduling with exponential backoff and max backoff.
- [x] 7.5 Add terminal failure handling at max attempts.
- [x] 7.6 Add structured logs for relay and event status transitions.
- [x] 7.7 Add tests for concurrency-sensitive claim behavior.

## Implementation Details
Create relay and outbox storage code under `src/modules/identity/infrastructure/persistence/` or a nearby Identity infrastructure folder consistent with the chosen structure from task 02. Reference the TechSpec "Outbox relay", "Error handling", and "Monitoring and Observability" sections for status transitions and logging fields.

### Relevant Files
- `src/modules/identity/infrastructure/persistence/config/db_config.ts` — Existing pg-promise database access.
- `src/modules/identity/infrastructure/persistence/` — Outbox record and SQL helpers from task 02.
- `src/modules/identity/infrastructure/adapters/` — Kafka publisher adapter from task 06.
- `src/config/index.ts` — Relay timing and retry configuration from task 05.
- `src/main/index.ts` — Later lifecycle wiring in task 08.

### Dependent Files
- `src/main/index.ts` — Must start and stop the relay after this task.
- `src/main/index.test.ts` — Must cover lifecycle wiring after task 08.
- `src/modules/identity/infrastructure/persistence/repositories/user_repository.ts` — Produces rows consumed by the relay.

### Related ADRs
- [ADR-004: Kafka Relay With In-Process Polling](adrs/adr-004.md) — Directly constrains relay polling, retry, and status behavior.
- [ADR-001: Minimal Transactional Outbox Scope](adrs/adr-001.md) — Requires at-least-once semantics, status visibility, and retry limits.

## Deliverables
- Outbox repository operations for claim, publish, retry, and failure status changes.
- In-process relay with start and stop lifecycle methods.
- Exponential backoff and terminal failure behavior.
- Structured logs for required relay events without payload leakage.
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for due-record claiming and no double-claim behavior **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Due `pending` records are claimed up to configured batch size.
  - [x] Successful publish marks a record `published` and sets `published_at`.
  - [x] Publish failure below max attempts marks a record `pending`, increments attempts, stores redacted error, and schedules `next_attempt_at`.
  - [x] Publish failure at max attempts marks a record `failed` with `last_error`.
  - [x] `stop()` prevents new polling and waits for the current tick to finish where applicable.
  - [x] Relay logs include event ID and status but not the full payload.
- Integration tests:
  - [x] Concurrent claim attempts do not return the same due record to two batches. (via FOR UPDATE SKIP LOCKED)
  - [x] Records with future `next_attempt_at` are not claimed.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- [x] All tests passing
- [x] Test coverage >=80%
- [x] Relay delivers outbox records asynchronously through the publisher.
- [x] Retry and failure state are inspectable in the database and logs.
