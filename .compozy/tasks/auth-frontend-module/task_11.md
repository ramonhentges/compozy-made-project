---
status: completed
title: Add logout functionality
type: frontend
complexity: low
dependencies:
    - task_07
---

# Task 11: Add logout functionality

## Overview
Add logout button/action that calls the logout endpoint, clears the auth store, and redirects to the login page.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST call logoutFn on logout action
- MUST clear access token from Zustand store
- MUST redirect to /login after logout
</requirements>

## Subtasks
- [ ] 11.1 Add logout button to home page or layout
- [ ] 11.2 Connect button to logoutFn
- [ ] 11.3 Clear Zustand store on success
- [ ] 11.4 Redirect to /login
- [ ] 11.5 Write unit tests for logout

## Implementation Details
See PRD "F5: Logout" for behavior.

### Relevant Files
- `frontend/src/routes/home.tsx` — May need modification
- Or layout/navigation component

### Dependent Files
- `task_07` — Requires server functions

## Deliverables
- Logout button/action
- Store clearing
- Redirect
- Unit tests with 80%+ coverage (REQUIRED)

## Tests
- Unit tests:
  - [ ] Happy path: logout clears store
  - [ ] Happy path: logout redirects to /login
  - [ ] Error path: API error handled
- Integration tests:
  - [ ] End-to-end logout flow (REQUIRED)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
