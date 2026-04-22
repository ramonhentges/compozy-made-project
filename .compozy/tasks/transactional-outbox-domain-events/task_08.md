---
status: completed
title: Wire relay lifecycle into Fastify bootstrap
type: backend
complexity: medium
dependencies:
    - task_07
---

# Task 8: Wire relay lifecycle into Fastify bootstrap

## Overview
Compose the outbox repository, Kafka publisher, and relay during application startup, then stop them during graceful shutdown. This completes the V1 in-process delivery path while preserving existing Identity HTTP behavior.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST construct the outbox relay and Kafka publisher from existing database and central config dependencies.
- MUST start the relay with the Fastify application lifecycle after dependencies are composed.
- MUST stop the relay and disconnect the Kafka producer during graceful shutdown.
- MUST keep `/health` and existing Identity routes behavior unchanged.
- MUST ensure Kafka publish failures do not block user-facing registration or password-change requests.
- SHOULD keep startup tests isolated from real database and Kafka connections through mocks.
</requirements>

## Subtasks
- [ ] 8.1 Compose outbox repository, Kafka publisher, and relay in `createServer`.
- [ ] 8.2 Start the relay during application startup.
- [ ] 8.3 Stop the relay during `stopServer` and Fastify close handling.
- [ ] 8.4 Disconnect the Kafka producer during graceful shutdown.
- [ ] 8.5 Update main tests to mock and assert relay lifecycle.
- [ ] 8.6 Run build and full test suite after lifecycle wiring.

## Implementation Details
Modify `src/main/index.ts` to wire the relay into the existing Fastify lifecycle. Reference the TechSpec "Application bootstrap" and "Kafka" sections for construction and shutdown expectations.

### Relevant Files
- `src/main/index.ts` — Existing Fastify bootstrap and shutdown flow.
- `src/main/index.test.ts` — Existing bootstrap import test and dependency mocks.
- `src/config/index.ts` — Kafka and relay configuration.
- `src/modules/identity/infrastructure/persistence/config/db_config.ts` — Database factory used by repository and outbox storage.
- `src/modules/identity/infrastructure/http/routes.ts` — Existing route registration should remain unchanged.

### Dependent Files
- `package.json` — Build and test scripts validate final wiring.
- `src/modules/identity/infrastructure/adapters/` — Kafka publisher adapter constructed here.
- `src/modules/identity/infrastructure/persistence/` — Outbox relay and repository constructed here.

### Related ADRs
- [ADR-004: Kafka Relay With In-Process Polling](adrs/adr-004.md) — Requires in-process relay startup and graceful shutdown.
- [ADR-002: Lean Reliability MVP Product Approach](adrs/adr-002.md) — Keeps V1 visibility to status fields and logs without adding dashboards.

## Deliverables
- Fastify bootstrap wiring for the outbox relay.
- Graceful shutdown path for relay and Kafka producer.
- Updated bootstrap tests with mocks for relay lifecycle.
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for startup/shutdown lifecycle behavior **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] `createServer` path constructs relay dependencies from central config.
  - [ ] `startServer` starts the relay without changing route registration.
  - [ ] `stopServer` stops the relay before closing database resources.
  - [ ] Kafka producer disconnect is called during shutdown.
  - [ ] Startup failure stops already-created lifecycle resources.
- Integration tests:
  - [ ] Existing `/health` route still returns `{ status: 'ok' }`.
  - [ ] Existing Identity route registration tests still pass with relay mocks.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Application startup launches the in-process outbox relay.
- Graceful shutdown stops polling and disconnects Kafka resources.
