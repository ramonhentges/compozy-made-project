---
status: completed
title: Create UUID Generator Utility
type: backend
complexity: low
dependencies: []
---

# Task 1: Create UUID Generator Utility

## Overview
Create a shared utility function that generates UUID v4 strings using Node.js built-in crypto module. This utility will be used by ID-type value objects that need auto-generation capability.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create file at `src/shared/utils/uuid_generator.ts`
- MUST use Node.js built-in `crypto.randomUUID()` for generation
- MUST export function `generateUuid(): string`
- MUST be used by UserId.create() for auto-generation
</requirements>

## Subtasks
- [x] 1.1 Create `src/shared/utils` directory if it doesn't exist
- [x] 1.2 Create `uuid_generator.ts` with `generateUuid()` function
- [x] 1.3 Export the function
- [x] 1.4 Write unit tests for the utility

## Implementation Details
See TechSpec 'Core Interfaces' section for the UUID Generator pattern.

### Relevant Files
- `src/shared/utils/uuid_generator.ts` — NEW FILE to create

### Dependent Files
- `src/modules/identity/domain/value_objects/user_id.ts` — will import this utility

### Related ADRs
- [ADR-003: Shared UUID Generation Utility](../adrs/adr-003.md)

## Deliverables
- `src/shared/utils/uuid_generator.ts` with `generateUuid()` function
- Unit tests for uuid_generator **(REQUIRED)**
- Test coverage >=80%

## Tests
- Unit tests:
  - [x] Validates that `generateUuid()` returns a valid UUID v4 string
  - [x] Validates that multiple calls produce unique values
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Utility function correctly generates UUID v4