---
status: completed
title: Add Kafka outbox publisher adapter
type: backend
complexity: medium
dependencies:
  - task_05
---

# Task 6: Add Kafka outbox publisher adapter

## Overview
Add the infrastructure adapter that publishes outbox records to Kafka using the configured broker settings. The adapter provides the relay with a small publisher boundary while keeping Kafka-specific code out of domain and use-case layers.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add a concrete Kafka client dependency selected for the Node/TypeScript stack.
- MUST implement an outbox publisher that publishes to the configured Identity topic.
- MUST key Kafka messages by aggregate ID.
- MUST publish the event envelope fields required by the TechSpec topic contract.
- MUST expose producer lifecycle operations needed by bootstrap shutdown.
- MUST keep publish failures visible to the relay by rejecting the publish call.
</requirements>

## Subtasks
- [x] 6.1 Add the Kafka client dependency to package metadata.
- [x] 6.2 Add an outbox publisher port or interface used by the relay.
- [x] 6.3 Implement the Kafka publisher adapter under Identity infrastructure.
- [x] 6.4 Add tests for topic, key, and event envelope mapping.
- [x] 6.5 Add tests for connect/disconnect or lifecycle behavior.
- [x] 6.6 Add tests proving publish failures are propagated.

## Implementation Details
Place the adapter near existing infrastructure adapters, such as `src/modules/identity/infrastructure/adapters/`. Reference the TechSpec "Kafka" topic contract and "Core Interfaces" sections for the publisher boundary and envelope shape.

### Relevant Files
- `package.json` — Add Kafka client dependency and ensure scripts remain intact.
- `package-lock.json` — Update lockfile after dependency installation.
- `src/modules/identity/infrastructure/adapters/jwt_adapter.ts` — Existing infrastructure adapter style.
- `src/modules/identity/infrastructure/adapters/jwt_adapter.test.ts` — Existing adapter test style.
- `src/modules/identity/infrastructure/persistence/` — Outbox record types from task 02.

### Dependent Files
- `src/modules/identity/infrastructure/persistence/` — Relay in task 07 consumes the publisher interface.
- `src/main/index.ts` — Bootstrap in task 08 constructs and shuts down the adapter.
- `src/main/index.test.ts` — Must mock the adapter after bootstrap wiring.

### Related ADRs
- [ADR-004: Kafka Relay With In-Process Polling](adrs/adr-004.md) — Requires Kafka delivery through an application-level publisher boundary.
- [ADR-001: Minimal Transactional Outbox Scope](adrs/adr-001.md) — Requires explicit at-least-once delivery semantics and stable event identity.

## Deliverables
- Kafka client dependency and lockfile update.
- Outbox publisher interface used by relay code.
- Kafka publisher adapter with lifecycle support.
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for adapter construction and bootstrap compatibility **(REQUIRED)**

## Tests
- Unit tests:
  - [x] Publishing a record sends to `IDENTITY_OUTBOX_TOPIC`.
  - [x] Publishing a record uses `aggregateId` as the Kafka message key.
  - [x] Published value includes `eventId`, `eventName`, `eventVersion`, `aggregateType`, `aggregateId`, `occurredOn`, and `data`.
  - [x] Producer send rejection rejects the adapter `publish` call.
  - [x] Adapter disconnect calls the Kafka producer disconnect method.
- Integration tests:
  - [x] Adapter can be constructed from central config without opening a real Kafka connection in tests.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Relay code has a Kafka-backed publisher boundary available.
- Kafka details remain isolated to infrastructure.
