---
status: completed
title: Update Password Value Object
type: backend
complexity: low
dependencies: []
---

# Task 4: Update Password Value Object

## Overview
Update the Password value object to make its constructor public. Password does not need auto-generation (not an ID-type), so only the constructor visibility change is required.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST make constructor public (change from `private constructor` to `public constructor`)
- MUST keep existing `create(hash: string)` method for validation
- Existing static create() must continue to throw InvalidPasswordError on empty input
</requirements>

## Subtasks
- [x] 4.1 Change constructor visibility from private to public

## Implementation Details
See TechSpec 'Password Value Object' section for the implementation pattern.

### Relevant Files
- `src/modules/identity/domain/value_objects/password.ts` — to modify

### Dependent Files
- `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` — will use public constructor
- `src/modules/identity/application/register_user/handler.ts` — uses create() method
- `src/modules/identity/domain/entities/user.ts` — uses Password.create()

### Related ADRs
- [ADR-001: Value Object Instantiation Pattern](../adrs/adr-001.md)

## Deliverables
- Updated password.ts with public constructor

## Tests
- Unit tests:
  - [x] Validates that public constructor accepts valid parameters
  - [x] Validates that Password.create(hash) throws on empty input
  - [x] Validates equals() works with new instances
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%