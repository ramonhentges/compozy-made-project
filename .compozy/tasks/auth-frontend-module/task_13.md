---
status: completed
title: Add name field to user registration
type: backend
complexity: medium
dependencies: []
---

# Task 13: Add name field to user registration

## Overview
Add the `name` field to the backend user registration flow. The current backend only accepts email and password, but the frontend registration form includes a name field that must be persisted.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST add name to User entity
- MUST add name to RegisterUserCommand
- MUST add name to RegisterController and its schema
- MUST include name in user response
- MUST ensure all existing tests still pass
</requirements>

## Subtasks
- [ ] 0.1 Modify User entity to include name
- [ ] 0.2 Modify RegisterUserCommand to include name
- [ ] 0.3 Modify RegisterUserHandler to accept name
- [ ] 0.4 Modify RegisterController to accept name in body
- [ ] 0.5 Update OpenAPI schema for register endpoint
- [ ] 0.6 Run existing tests and fix any failures

## Implementation Details
The user's PRD requires the registration form to include a name field. This task adds the name to all backend layers.

### Relevant Files
- `backend/src/modules/identity/domain/entities/user.ts` — User entity to modify
- `backend/src/modules/identity/application/register_user/command.ts` — Command to modify
- `backend/src/modules/identity/application/register_user/handler.ts` — Handler to modify
- `backend/src/modules/identity/infrastructure/http/controllers/register_controller.ts` — Controller to modify

### Dependent Files
- None — This is a prerequisite task

## Deliverables
- User entity with name field
- Command with name
- Controller accepts name in request body
- All tests passing

## Tests
- Unit tests:
  - [ ] Happy path: registration with name succeeds
  - [ ] Edge case: name length validation
- Integration tests:
  - [ ] End-to-end registration with name (REQUIRED)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Registration endpoint accepts name field
- Name returned in response
