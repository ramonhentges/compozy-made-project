# Task Memory: task_07.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Implement outbox relay with claiming, publishing, retry, status transitions, and structured logging.

## Important Decisions
- Used pg-promise's `FOR UPDATE SKIP LOCKED` to safely claim due records without double-claiming in concurrent environments.
- Exponential backoff uses `base * 2^(attempts-1)` capped at max backoff.
- Relay stops gracefully - waits for current poll to finish before disconnecting publisher.
- Error redaction strips sensitive patterns (password, token, secret, credential, api_key) from logged errors.

## Learnings
- pg-promise uses `many` for multiple rows and `oneOrNone` for optional single row (not `oneOrNull`).
- Structured logging uses `console.log` with JSON stringified objects, not JSON.stringify directly.
- Relay poll interval must be longer than test timeouts to avoid infinite loops in tests.
- Terminal failure occurs when attempts >= maxAttempts (not >).

## Files / Surfaces
- Created: `src/modules/identity/infrastructure/relay/outbox_relay.ts`
- Created: `src/modules/identity/infrastructure/relay/outbox_relay.test.ts`
- Created: `src/modules/identity/infrastructure/persistence/repositories/outbox_repository.ts`
- Created: `src/modules/identity/infrastructure/persistence/repositories/outbox_repository.test.ts`
- Created: `src/modules/identity/infrastructure/persistence/mappers/outbox_record_mapper.ts`
- Modified: Config already had OutboxRelayConfig.

## Errors / Corrections
- Fixed: Initially used `oneOrNull` instead of `oneOrNone` for pg-promise.
- Fixed: Tests needed to use real timers with small intervals, not fake timers for the recursive polling.

## Ready for Next Run
- Task 08: Wire relay into main/index.ts lifecycle (start on boot, stop on shutdown).
