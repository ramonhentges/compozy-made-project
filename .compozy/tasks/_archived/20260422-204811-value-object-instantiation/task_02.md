---
status: completed
title: Update UserId Value Object
type: backend
complexity: low
dependencies:
    - task_01
---

# Task 2: Update UserId Value Object

## Overview
Update the UserId value object to make its constructor public and add a parameterless `create()` method that auto-generates a UUID v4 using the shared utility.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST make constructor public (change from `private constructor` to `public constructor`)
- MUST add parameterless `create()` method that generates UUID v4 using generateUuid()
- MUST keep existing `create(value: string)` method for validated creation
- MUST keep existing private `isValid()` method for validation
- Existing static create() must continue to throw InvalidUserIdError on invalid input
</requirements>

## Subtasks
- [ ] 2.1 Change constructor visibility from private to public
- [ ] 2.2 Add import for generateUuid from shared utility
- [ ] 2.3 Add parameterless `create()` static method
- [ ] 2.4 Update existing tests for public constructor
- [ ] 2.5 Add tests for parameterless create()

## Implementation Details
See TechSpec 'UserId Value Object' section for the implementation pattern.

### Relevant Files
- `src/modules/identity/domain/value_objects/user_id.ts` — to modify

### Dependent Files
- `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` — will use public constructor
- `src/modules/identity/application/register_user/handler.ts` — uses create() method
- `src/modules/identity/domain/value_objects/user_id.test.ts` — test file

### Related ADRs
- [ADR-001: Value Object Instantiation Pattern](../adrs/adr-001.md)
- [ADR-003: Shared UUID Generation Utility](../adrs/adr-003.md)

## Deliverables
- Updated user_id.ts with public constructor and parameterless create()
- Updated unit tests for user_id **(REQUIRED)**
- Test coverage >=80%

## Tests
- Unit tests:
  - [ ] Validates that `UserId.create()` generates valid UUID v4
  - [ ] Validates that `UserId.create(value)` throws on invalid input
  - [ ] Validates that public constructor accepts valid parameters
  - [ ] Validates equals() works with new instances
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- UserId.create() generates valid UUID v4
