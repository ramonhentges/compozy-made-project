# Task Memory: task_05.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Add Kafka and relay configuration to central app config.

## Important Decisions

- Extended `AppConfig` with `KafkaConfig` and `OutboxRelayConfig` interfaces
- Used safe defaults for all relay settings (poll: 1000ms, batch: 100, max attempts: 5, backoff base: 1000ms, backoff max: 60000ms)
- Kafka brokers default to `localhost:9092`, client ID to `identity-service`, topic to `identity-outbox`
- Comma-separated broker parsing with trim and filter

## Learnings

- Config tests use `vi.resetModules()` to re-import after env var changes
- Tests must reset `process.env` in both `beforeEach` and `afterEach`
- Main bootstrap test mock needed update to include `identityDatabase` instead of `database`

## Files / Surfaces

- `src/config/index.ts` - Added Kafka and outbox relay config interfaces and parsing
- `src/config/index.test.ts` - Added 20 new tests for Kafka and relay config
- `src/main/index.test.ts` - Updated mock to include new config fields

## Errors / Corrections

- None - implementation completed on first attempt

## Ready for Next Run

Ready for task_06 (Kafka publisher adapter) which will consume the new config.
