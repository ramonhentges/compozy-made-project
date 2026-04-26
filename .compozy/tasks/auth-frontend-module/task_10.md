---
status: completed
title: Create protected home page with route guard
type: frontend
complexity: medium
dependencies:
  - task_06
  - task_07
---

# Task 10: Create protected home page with route guard

## Overview
Create the protected home page (/home) with route guard validation. Unauthenticated users are redirected to /login with a returnUrl parameter.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create /home route (protected)
- MUST validate authentication via loader/beforeLoad
- MUST redirect unauthenticated users to /login?redirect=/home
- MUST display user information when authenticated
</requirements>

## Subtasks
- [x] 10.1 Create frontend/src/routes/home.tsx
- [x] 10.2 Implement route guard in loader
- [x] 10.3 Handle redirect param for post-login return
- [x] 10.4 Display user info on protected page
- [x] 10.5 Write unit tests for route guard

## Implementation Details
See TechSpec "Route Structure" section and PRD "F4: Protected Route / Home Page" for behavior.

### Relevant Files
- `frontend/src/routes/home.tsx` — New file to create

### Dependent Files
- `task_06` — Requires root loader
- `task_07` — Requires server functions

## Deliverables
- Protected home page
- Route guard with redirect
- Unit tests with 80%+ coverage (REQUIRED)

## Tests
- Unit tests:
  - [x] Happy path: authenticated user can access
  - [x] Happy path: unauthenticated user redirected
  - [x] Edge case: returnUrl preserved in redirect
- Integration tests:
  - [x] End-to-end protected route access (REQUIRED)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Redirect preserves returnUrl