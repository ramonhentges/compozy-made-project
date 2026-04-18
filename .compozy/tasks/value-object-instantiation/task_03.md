---
status: completed
title: Update Email Value Object
type: backend
complexity: low
dependencies: []
---

# Task 3: Update Email Value Object

## Overview
Update the Email value object to make its constructor public. Email does not need auto-generation (not an ID-type), so only the constructor visibility change is required.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST make constructor public (change from `private constructor` to `public constructor`)
- MUST keep existing `create(value: string)` method for validation
- MUST keep existing private `isValid()` method for validation
- Existing static create() must continue to throw InvalidEmailError on invalid input
</requirements>

## Subtasks
- [ ] 3.1 Change constructor visibility from private to public
- [ ] 3.2 Update existing tests for public constructor

## Implementation Details
See TechSpec 'Email Value Object' section for the implementation pattern.

### Relevant Files
- `src/modules/identity/domain/value_objects/email.ts` — to modify

### Dependent Files
- `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` — will use public constructor
- `src/modules/identity/application/register_user/handler.ts` — uses create() method
- `src/modules/identity/domain/value_objects/email.test.ts` — test file

### Related ADRs
- [ADR-001: Value Object Instantiation Pattern](../adrs/adr-001.md)

## Deliverables
- Updated email.ts with public constructor
- Updated unit tests for email **(REQUIRED)**
- Test coverage >=80%

## Tests
- Unit tests:
  - [ ] Validates that public constructor accepts valid parameters
  - [ ] Validates that Email.create(value) throws on invalid input
  - [ ] Validates equals() works with new instances
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
