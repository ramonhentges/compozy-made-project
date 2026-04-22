---
status: completed
title: Identity HTTP Controllers
type: backend
complexity: medium
dependencies:
  - task_05
---

# Task 06: Identity HTTP Controllers

## Overview

Implement Fastify HTTP controllers for register, login, and logout endpoints. These are the driver adapters that expose the application layer to the outside world.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create RegisterController with POST /identity/register
- MUST create LoginController with POST /identity/login
- MUST create LogoutController with POST /identity/logout
- MUST create routes.ts aggregating all identity routes
- MUST validate request bodies with proper schemas
- MUST return appropriate HTTP status codes per TechSpec
</requirements>

## Subtasks
- [x] 6.1 Create RegisterController handling POST /identity/register
- [x] 6.2 Create LoginController handling POST /identity/login
- [x] 6.3 Create LogoutController handling POST /identity/logout
- [x] 6.4 Create routes.ts with all identity endpoints
- [x] 6.5 Create auth middleware for logout (if needed)

## Implementation Details

### Relevant Files
- `src/modules/identity/infrastructure/http/controllers/register_controller.ts`
- `src/modules/identity/infrastructure/http/controllers/login_controller.ts`
- `src/modules/identity/infrastructure/http/controllers/logout_controller.ts`
- `src/modules/identity/infrastructure/http/routes.ts`

### Dependent Files
- Composition root will wire controllers to routes

### Related ADRs
- [ADR-001: Self-contained module structure](../adrs/adr-001.md)

## Deliverables
- RegisterController returning 201 on success
- LoginController returning 200 with tokens
- LogoutController returning 200 on success
- routes.ts with all endpoints registered

## Tests
- Unit tests:
  - [x] RegisterController validates request body
  - [x] RegisterController returns 201 on success
  - [x] LoginController returns 401 on invalid credentials
  - [x] LogoutController validates authorization
- Integration tests:
  - [ ] Full HTTP flow: register → login → logout (deferred to task_08)

## Success Criteria
- [x] All endpoints respond with correct status codes
- [x] Request validation works correctly

## Verification
- Build: `npm run build` - PASS
- Tests: `npm run test` - 67 tests PASS