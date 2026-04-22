---
status: completed
title: Add Kafka and relay configuration
type: backend
complexity: low
dependencies:
  - task_02
---

# Task 5: Add Kafka and relay configuration

## Overview
Expose runtime configuration for Kafka publishing and in-process outbox relay behavior. This keeps broker and retry behavior configurable without leaking delivery details into the domain model or application use cases.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add configuration for Kafka brokers, client ID, and Identity outbox topic.
- MUST add configuration for relay poll interval, batch size, max attempts, base backoff, and maximum backoff.
- MUST parse numeric relay settings as numbers with safe defaults or required validation as appropriate.
- MUST keep config centralized under `src/config/`.
- SHOULD make tests verify environment variable overrides and default behavior.
- MUST NOT require Kafka connectivity during config unit tests.
</requirements>

## Subtasks
- [x] 5.1 Extend `AppConfig` with Kafka and outbox relay settings.
- [x] 5.2 Add environment parsing for Kafka brokers and topic name.
- [x] 5.3 Add environment parsing for relay timing, batch, attempts, and backoff settings.
- [x] 5.4 Add tests for defaults and environment overrides.
- [x] 5.5 Update main/bootstrap tests that mock config.

## Implementation Details
Modify `src/config/index.ts` and its tests. Reference the TechSpec "Kafka" configuration list for the exact environment variables.

### Relevant Files
- `src/config/index.ts` — Central application config shape.
- `src/config/index.test.ts` — Existing config tests and env reset pattern.
- `src/config/databases/identity_context.ts` — Current database config style.
- `src/main/index.test.ts` — Existing config mock must stay structurally compatible.

### Dependent Files
- `src/modules/identity/infrastructure/adapters/` — Kafka publisher adapter in task 06 consumes Kafka config.
- `src/modules/identity/infrastructure/persistence/` — Relay in task 07 consumes relay config.
- `src/main/index.ts` — Bootstrap wiring in task 08 consumes both config groups.

### Related ADRs
- [ADR-004: Kafka Relay With In-Process Polling](adrs/adr-004.md) — Requires configurable Kafka and relay behavior.

## Deliverables
- Extended `AppConfig` for Kafka and outbox relay settings.
- Environment variable parsing for all TechSpec Kafka and relay settings.
- Config unit tests for defaults and overrides.
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for bootstrap compatibility with config mocks **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Default config includes usable Kafka client ID and relay poll/backoff values.
  - [x] `KAFKA_BROKERS` parses a comma-separated broker list.
  - [x] `IDENTITY_OUTBOX_TOPIC` overrides the default topic.
  - [x] Relay numeric environment variables override poll interval, batch size, max attempts, base backoff, and max backoff.
  - [x] Invalid or missing required values produce clear config errors where required by the implementation.
- Integration tests:
  - [x] `src/main/index.test.ts` can import the app with the extended config mock.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Kafka and relay settings are available through central config.
- No domain or application code depends on environment variables directly.
