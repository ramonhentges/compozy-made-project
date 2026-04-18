---
status: completed
title: Update UserMapper
type: backend
complexity: low
dependencies:
    - task_02
    - task_03
    - task_04
    - task_05
---

# Task 6: Update UserMapper

## Overview
Update the UserMapper to use public constructors directly for instantiating domain objects from database DTOs. This avoids redundant validation since the data has already been validated by the database.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST change `toDomain()` to use constructors instead of `create()` methods
- MUST use `new UserId(dto.id)` instead of `UserId.create(dto.id)`
- MUST use `new Email(dto.email)` instead of `Email.create(dto.email)`
- MUST use `new Password(dto.password_hash)` instead of `Password.create(dto.password_hash)`
- MUST use `new User(userId, email, password, dto.created_at, dto.updated_at)` for entity construction
- `toDTO()` method should remain unchanged (already uses getters)
</requirements>

## Subtasks
- [ ] 6.1 Update UserId instantiation to use constructor
- [ ] 6.2 Update Email instantiation to use constructor
- [ ] 6.3 Update Password instantiation to use constructor
- [ ] 6.4 Update User instantiation to use constructor
- [ ] 6.5 Update existing mapper tests

## Implementation Details
See TechSpec 'UserMapper' section for the implementation pattern.

### Relevant Files
- `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` — to modify

### Dependent Files
- `src/modules/identity/infrastructure/persistence/mappers/user_mapper.test.ts` — test file

### Related ADRs
- [ADR-001: Value Object Instantiation Pattern](../adrs/adr-001.md)

## Deliverables
- Updated user_mapper.ts using constructors
- Updated unit tests for user_mapper **(REQUIRED)**
- Test coverage >=80%

## Tests
- Unit tests:
  - [ ] Validates that `toDomain(dto)` produces valid domain objects
  - [ ] Validates round-trip: `toDomain(toDTO(user))` equals original
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- UserMapper uses constructors in toDomain()
