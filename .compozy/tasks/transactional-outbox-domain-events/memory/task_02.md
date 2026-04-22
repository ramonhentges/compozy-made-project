# Task Memory: task_02.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
- Add Identity infrastructure outbox record/status types, a DomainEvent-to-outbox mapper, SQL insert helpers, and tests. Keep domain events unchanged and leave repository transaction wiring for task_03.

## Important Decisions
- Scope is infrastructure-only under `src/modules/identity/infrastructure/persistence/`; `UserRepository` should not be changed in this task.
- Identity outbox mapping is allowlisted by event name: `UserRegistered` maps only `{ email }`, `PasswordChanged` maps `null`, and unsupported event names throw.

## Learnings
- Pre-change baseline: `outbox_event_mapper.ts` and `outbox_sql.ts` do not exist yet; Task 1 outbox migration exists with the `events` table columns required by the TechSpec.
- Payload insert params are JSON strings and SQL casts `$6::jsonb`, so `PasswordChanged` stores JSON null while satisfying the migration's `payload JSONB NOT NULL` constraint.
- Verification after implementation: `npm run test:coverage` passed with 29 files / 170 tests and 91.86% statement coverage; `npm run build` passed.

## Files / Surfaces
- Added `src/modules/identity/infrastructure/persistence/types/outbox_record.ts`.
- Added `src/modules/identity/infrastructure/persistence/mappers/outbox_event_mapper.ts` and mapper tests.
- Added `src/modules/identity/infrastructure/persistence/sql/outbox_sql.ts` plus a migration-order integration test.

## Errors / Corrections
- Added an extra sensitive-field test during self-review to prove event-like extra `passwordHash`, `token`, and request metadata fields are dropped from the mapped payload.

## Ready for Next Run
- Task 3 can consume `OutboxEventMapper.toInsertData`, `INSERT_OUTBOX_EVENT_SQL`, and `toOutboxInsertParams` from `UserRepository` transaction work.
