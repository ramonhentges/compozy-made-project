---
status: completed
title: Update User Entity
type: backend
complexity: medium
dependencies:
  - task_02
  - task_03
  - task_04
---

# Task 5: Update User Entity

## Overview
Update the User entity to make its constructor public, enabling mappers to reconstruct entities from database data without using the static create() method.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST make constructor public (change from `private constructor` to `public constructor`)
- MUST keep existing static `create()` method for application layer validation
- MUST keep existing methods: getId(), email, password, createdAt, updatedAt, changePassword()
- Existing static create() must continue to work as before
</requirements>

## Subtasks
- [ ] 5.1 Change constructor visibility from private to public
- [ ] 5.2 Verify all existing functionality still works

## Implementation Details
See TechSpec 'User Entity' section for the implementation pattern.

### Relevant Files
- `src/modules/identity/domain/entities/user.ts` — to modify

### Dependent Files
- `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` — will use public constructor
- `src/modules/identity/application/register_user/handler.ts` — uses create() method
- `src/modules/identity/domain/entities/user.test.ts` — test file

### Related ADRs
- [ADR-001: Value Object Instantiation Pattern](../adrs/adr-001.md)
- [ADR-002: Entity Constructor Visibility](../adrs/adr-002.md)

## Deliverables
- Updated user.ts with public constructor
- Updated unit tests for User entity **(REQUIRED)**
- Test coverage >=80%

## Tests
- Unit tests:
  - [ ] Validates that public constructor accepts valid parameters
  - [ ] Validates that User.create() still works for new entity creation
  - [ ] Validates that changePassword() method works
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%