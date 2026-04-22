---
status: completed
title: Add Identity outbox migration
type: infra
complexity: medium
dependencies: []
---

# Task 1: Add Identity outbox migration

## Overview
Add the database structure that stores durable Identity domain events for the transactional outbox. This gives repository persistence a committed target for event envelopes, retry metadata, and operational status.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add an Identity-context migration that creates the outbox `events` table described in the TechSpec "Data Models" section.
- MUST include status, attempt, scheduling, error, occurrence, processing, publication, and creation fields needed by the relay.
- MUST include indexes for due-record polling, aggregate investigation, and event type/version filtering.
- MUST include a rollback migration that removes only the outbox table and its indexes.
- MUST keep the migration under `src/migrations/identity_context/` and preserve existing migration naming conventions.
- MUST NOT add public HTTP endpoints, dashboards, replay tooling, or cross-context schema changes in V1.
</requirements>

## Subtasks
- [x] 1.1 Add the outbox table migration to the Identity migration folder.
- [x] 1.2 Add the matching rollback migration.
- [x] 1.3 Ensure the schema captures all status and retry fields required by the TechSpec.
- [x] 1.4 Ensure polling, aggregate, and event-type indexes are present.
- [x] 1.5 Extend migration structure tests to recognize the outbox migration.
- [x] 1.6 Extend migration SQL tests to verify expected columns and indexes.

## Implementation Details
Create a new timestamped migration pair under `src/migrations/identity_context/`. Follow the existing SQL migration style from the initial schema and reference the TechSpec "Data Models" section for the exact column set, statuses, and index intent.

### Relevant Files
- `src/migrations/identity_context/20260418184459_initial_schema.sql` — Existing up migration style and table conventions.
- `src/migrations/identity_context/20260418184459_initial_schema_down.sql` — Existing rollback style.
- `src/migrations/identity_context/folder-structure.test.ts` — Migration folder and naming tests.
- `src/migrations/identity_context/migration-execution.test.ts` — Migration discovery and SQL validation tests.
- `.compozy/tasks/transactional-outbox-domain-events/_techspec.md` — Source for outbox table fields and indexes.

### Dependent Files
- `src/modules/identity/infrastructure/persistence/repositories/user_repository.ts` — Later tasks insert rows into the new table.
- `src/modules/identity/infrastructure/persistence/` — Later tasks add mappers and repository helpers for this schema.
- `src/config/package-json-scripts.test.ts` — May need updates if migration script expectations change.

### Related ADRs
- [ADR-001: Minimal Transactional Outbox Scope](adrs/adr-001.md) — Requires durable event capture with status and safety metadata.
- [ADR-003: Repository-Captured Outbox Persistence](adrs/adr-003.md) — Requires outbox rows in the Identity persistence transaction.

## Deliverables
- New Identity outbox up migration.
- New Identity outbox down migration.
- Tests asserting the migration creates required outbox columns and indexes.
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for migration structure and SQL expectations **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Migration file discovery finds an outbox up migration in `src/migrations/identity_context`.
  - [x] Migration file discovery finds a matching outbox down migration.
  - [x] SQL validation confirms the table includes `id`, `event_name`, `event_version`, `aggregate_type`, `aggregate_id`, `payload`, `status`, `attempts`, `next_attempt_at`, `last_error`, `occurred_on`, `created_at`, `processing_started_at`, and `published_at`.
  - [x] SQL validation confirms the polling, aggregate, and event-type indexes exist.
- Integration tests:
  - [x] Existing migration execution tests still pass with the added migration files.
  - [x] Rollback SQL validation confirms the outbox table is dropped without affecting the existing `users` table.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Identity migrations contain a durable outbox schema matching the TechSpec.
- Migration rollback is scoped to the outbox objects.
