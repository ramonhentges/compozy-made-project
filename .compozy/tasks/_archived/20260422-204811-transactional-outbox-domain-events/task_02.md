---
status: completed
title: Add outbox record model and persistence helpers
type: backend
complexity: medium
dependencies:
  - task_01
---

# Task 2: Add outbox record model and persistence helpers

## Overview
Add infrastructure-side outbox types, mappers, and SQL helpers that convert pure domain events into durable outbox records. This keeps domain events free of database concerns while giving repositories and the relay a shared persistence model.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST define an infrastructure-owned outbox record shape aligned with the TechSpec "Core Interfaces" and "Data Models" sections.
- MUST map existing Identity domain events, including `UserRegistered` and `PasswordChanged`, without changing domain event classes.
- MUST preserve event name, version, aggregate ID, occurred date, and payload.
- MUST set aggregate type to the Identity aggregate represented by the event.
- MUST avoid persisting passwords, password hashes, tokens, request metadata, or full payloads in logs.
- SHOULD isolate SQL statements or helper functions so `UserRepository` does not own all outbox mapping details.
</requirements>

## Subtasks
- [x] 2.1 Add outbox record and status types under Identity infrastructure persistence.
- [x] 2.2 Add a mapper from `DomainEvent` to outbox insert data.
- [x] 2.3 Add SQL helpers for inserting outbox rows.
- [x] 2.4 Add tests for mapping `UserRegistered` payload data.
- [x] 2.5 Add tests for mapping `PasswordChanged` null payload data.
- [x] 2.6 Add tests proving sensitive fields are not introduced by the mapper.

## Implementation Details
Create files under `src/modules/identity/infrastructure/persistence/` to match the existing mapper and repository organization. Reference the TechSpec "Data Models" and "Payload rules" sections for the outbox envelope and payload boundaries.

### Relevant Files
- `src/shared/types/domain_event.ts` — Current pure domain event contract.
- `src/modules/identity/domain/events/user_registered.ts` — Existing registration event payload.
- `src/modules/identity/domain/events/password_changed.ts` — Existing password-change event payload.
- `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` — Current infrastructure mapper style.
- `src/modules/identity/infrastructure/persistence/mappers/user_mapper.test.ts` — Current mapper test style.

### Dependent Files
- `src/modules/identity/infrastructure/persistence/repositories/user_repository.ts` — Will consume the mapper and SQL helper in task 03.
- `src/modules/identity/infrastructure/persistence/repositories/user_repository.test.ts` — Will assert outbox insert behavior in task 04.
- `src/modules/identity/infrastructure/persistence/` — Later relay repository operations should reuse compatible record types.

### Related ADRs
- [ADR-001: Minimal Transactional Outbox Scope](adrs/adr-001.md) — Requires stable event identity, envelope fields, and payload minimization.
- [ADR-003: Repository-Captured Outbox Persistence](adrs/adr-003.md) — Requires infrastructure-only outbox row mapping.

## Deliverables
- Infrastructure outbox record and status types.
- Domain event to outbox record mapper.
- Outbox insert SQL helper or persistence utility.
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for mapper compatibility with repository persistence expectations **(REQUIRED)**

## Tests
- Unit tests:
  - [x] `UserRegistered` maps to event name `UserRegistered`, version `1`, aggregate ID, occurrence date, aggregate type, and `{ email }` payload.
  - [x] `PasswordChanged` maps to event name `PasswordChanged`, version `1`, aggregate ID, occurrence date, aggregate type, and `null` payload.
  - [x] Outbox insert data includes initial `pending` status and retry scheduling fields expected by the migration.
  - [x] Mapping output does not contain password hashes, tokens, or request metadata.
- Integration tests:
  - [x] SQL helper parameter order matches the outbox migration columns expected by repository transaction tests.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Infrastructure has reusable outbox mapping and insert helpers.
- Domain and application layers remain independent of outbox persistence details.
