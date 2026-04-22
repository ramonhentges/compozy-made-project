---
status: completed
title: Add repository atomicity and event-pull tests
type: backend
complexity: medium
dependencies:
    - task_03
---

# Task 4: Add repository atomicity and event-pull tests

## Overview
Harden the repository test suite around the new outbox transaction contract. These tests should prove that aggregate persistence and outbox persistence are atomic, and that domain events are not cleared before successful transaction work.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add focused tests for `UserRepository.save` transaction behavior.
- MUST add focused tests for `UserRepository.update` transaction behavior after `User.changePassword`.
- MUST assert failed aggregate persistence does not clear domain events.
- MUST assert failed outbox insertion does not clear domain events.
- MUST assert successful persistence clears domain events exactly once.
- SHOULD preserve existing repository read, update, and delete test coverage.
</requirements>

## Subtasks
- [ ] 4.1 Update repository mocks to support pg-promise transaction callbacks.
- [ ] 4.2 Add save-path tests for user insert plus outbox insert.
- [ ] 4.3 Add update-path tests for password-change event capture.
- [ ] 4.4 Add failure-path tests for aggregate persistence failure.
- [ ] 4.5 Add failure-path tests for outbox insertion failure.
- [ ] 4.6 Add success-path tests for event buffer clearing.

## Implementation Details
Update `src/modules/identity/infrastructure/persistence/repositories/user_repository.test.ts` and any helper tests introduced in task 02. Reference the TechSpec "Testing Approach" section for the expected coverage and mocks.

### Relevant Files
- `src/modules/identity/infrastructure/persistence/repositories/user_repository.test.ts` — Existing repository test suite.
- `src/modules/identity/infrastructure/persistence/repositories/user_repository.ts` — Behavior under test.
- `src/modules/identity/domain/entities/user.test.ts` — Existing aggregate event behavior tests.
- `src/shared/types/aggregate_root.test.ts` — Existing event buffer behavior tests.

### Dependent Files
- `src/modules/identity/application/register_user/handler.test.ts` — May rely on repository mock behavior remaining compatible.
- `src/main/index.test.ts` — May need mock updates after repository constructor or dependency changes.

### Related ADRs
- [ADR-003: Repository-Captured Outbox Persistence](adrs/adr-003.md) — Requires testing event-clearing and rollback paths.

## Deliverables
- Expanded repository unit tests for transaction and outbox behavior.
- Failure-path tests proving event buffer preservation.
- Success-path tests proving event buffer clearing.
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for repository atomicity where database test support exists **(REQUIRED)**

## Tests
- Unit tests:
  - [ ] Mock transaction receives both the aggregate write and outbox write during `save`.
  - [ ] Mock transaction receives both the aggregate write and outbox write during `update` after a password change.
  - [ ] User insert rejection leaves pending domain events available.
  - [ ] Outbox insert rejection leaves pending domain events available.
  - [ ] Successful transaction clears pending domain events and prevents duplicate inserts on a second save with no new events.
- Integration tests:
  - [ ] Test database rollback path leaves no partially committed user or outbox row when outbox insertion fails.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Repository transaction behavior is covered before relay work depends on it.
- Event-pull timing is protected against regression.
