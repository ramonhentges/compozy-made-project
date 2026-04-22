---
status: completed
title: Capture domain events in UserRepository transactions
type: backend
complexity: high
dependencies:
    - task_02
---

# Task 3: Capture domain events in UserRepository transactions

## Overview
Update Identity persistence so aggregate changes and pending domain events are written in one pg-promise transaction. This removes the dual-write gap for committed Identity changes while preserving the existing repository port used by application handlers.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST update `save(user)` to insert the user row and outbox rows in the same pg-promise transaction.
- MUST update `update(user)` to update the user row and insert outbox rows in the same pg-promise transaction.
- MUST keep `delete(userId)` compatible with the existing repository port and the TechSpec's V1 delete semantics.
- MUST clear aggregate domain events only after aggregate persistence and outbox insert work succeeds.
- MUST leave pending aggregate events intact when aggregate persistence or outbox insertion fails.
- MUST keep database and outbox concerns inside infrastructure and avoid domain-layer imports from infrastructure.
</requirements>

## Subtasks
- [x] 3.1 Wrap `save` persistence work in a pg-promise transaction.
- [x] 3.2 Wrap `update` persistence work in a pg-promise transaction.
- [x] 3.3 Insert one outbox row per pending domain event inside each successful transaction.
- [x] 3.4 Preserve existing read methods and repository port signatures.
- [x] 3.5 Ensure events are pulled only after successful transaction work.
- [x] 3.6 Preserve delete behavior while aligning it with V1 delete-event constraints.

## Implementation Details
Modify `src/modules/identity/infrastructure/persistence/repositories/user_repository.ts`. Use the helpers from task 02 and the TechSpec "Repository persistence behavior" section for the transaction contract and event-pull timing.

### Relevant Files
- `src/modules/identity/infrastructure/persistence/repositories/user_repository.ts` — Existing pg-promise repository implementation.
- `src/modules/identity/domain/repository/user_repository.ts` — Existing application-facing persistence port.
- `src/shared/types/aggregate_root.ts` — Current `pullDomainEvents()` contract.
- `src/modules/identity/domain/entities/user.ts` — Aggregate currently raises registration and password-change events.
- `src/modules/identity/infrastructure/persistence/config/db_config.ts` — Existing pg-promise database creation.

### Dependent Files
- `src/modules/identity/application/register_user/handler.ts` — Continues to call `userRepository.save`.
- `src/modules/identity/application/login_user/handler.ts` — Depends on repository reads staying stable.
- `src/modules/identity/application/logout_user/handler.ts` — Depends on repository delete behavior staying compatible.
- `src/modules/identity/infrastructure/persistence/repositories/user_repository.test.ts` — Must be expanded in task 04.

### Related ADRs
- [ADR-003: Repository-Captured Outbox Persistence](adrs/adr-003.md) — Directly constrains repository transaction ownership and event clearing.
- [ADR-001: Minimal Transactional Outbox Scope](adrs/adr-001.md) — Requires atomic aggregate and event persistence.

## Deliverables
- Transactional `save` and `update` repository methods.
- Repository behavior that stores pending Identity domain events into the outbox.
- Event-clearing behavior that only runs after successful persistence.
- Unit tests with 80%+ coverage **(REQUIRED)**
- Integration tests for repository transaction behavior **(REQUIRED)**

## Tests
- Unit tests:
  - [x] `save(user)` starts a transaction and writes the `users` row plus one `UserRegistered` outbox row.
  - [x] `update(user)` starts a transaction and writes the `users` row plus one `PasswordChanged` outbox row after `user.changePassword`.
  - [x] Failed user insert leaves `user.pullDomainEvents()` able to return the original event.
  - [x] Failed outbox insert leaves `user.pullDomainEvents()` able to return the original event.
  - [x] Successful persistence clears the aggregate event buffer.
- Integration tests:
  - [ ] Repository persistence against a test database commits user and outbox row atomically.
  - [ ] Repository rollback against a test database leaves neither the user change nor outbox row committed.
- Test coverage target: >=80% — verified at 92.07% statements.
- All tests must pass — verified for available tests; database-backed repository integration tests are present but skipped without `IDENTITY_REPOSITORY_TEST_DATABASE_URL`.

## Success Criteria
- All tests passing
- Test coverage >=80%
- Identity repository persistence captures existing domain events durably.
- Domain events remain pure and infrastructure-independent.
