---
status: completed
title: Create auth Zod schemas
type: frontend
complexity: low
dependencies:
    - task_03
---

# Task 05: Create auth Zod schemas

## Overview
Create shared Zod validation schemas for registration and login forms. These schemas are used by both the forms and server functions for validation.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement registerSchema with email, name, password
- MUST implement loginSchema with email, password
- MUST export inferred types (RegisterInput, LoginInput)
- MUST include proper error messages in schemas
</requirements>

## Subtasks
- [ ] 5.1 Create frontend/src/api/ directory
- [ ] 5.2 Create auth.schemas.ts with registerSchema
- [ ] 5.3 Create auth.schemas.ts with loginSchema
- [ ] 5.4 Export type inferences
- [ ] 5.5 Write unit tests for schema validation

## Implementation Details
See TechSpec "Data Models" section for schema definitions.

### Relevant Files
- `frontend/src/api/auth.schemas.ts` — New file to create

### Dependent Files
- `task_03` — Requires installed Zod package

## Deliverables
- Shared Zod validation schemas
- Unit tests with 80%+ coverage (REQUIRED)

## Tests
- Unit tests:
  - [ ] Happy path: valid register input passes
  - [ ] Happy path: valid login input passes
  - [ ] Error path: invalid email format fails
  - [ ] Edge case: name too short fails
  - [ ] Edge case: password too short fails
  - [ ] Edge case: missing required fields fail
- Integration tests:
  - [ ] None at this stage
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
