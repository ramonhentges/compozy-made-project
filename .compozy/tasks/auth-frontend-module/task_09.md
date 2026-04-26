---
status: completed
title: Create login form page
type: frontend
complexity: medium
dependencies:
    - task_07
---

# Task 09: Create login form page

## Overview
Create the login page (/login) with a form using React Hook Form and Zod validation. On success, stores the access token in Zustand and redirects to protected page.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create /login route
- MUST include email, password fields
- MUST use React Hook Form with Zod resolver
- MUST display inline validation errors
- MUST call loginFn on submit
- MUST store access token in Zustand on success
- MUST redirect to protected page (or returnUrl) on success
- MUST show generic error for invalid credentials
</requirements>

## Subtasks
- [ ] 9.1 Create frontend/src/routes/login.tsx
- [ ] 9.2 Implement form with React Hook Form
- [ ] 9.3 Add fields with shadcn components
- [ ] 9.4 Connect form to loginFn
- [ ] 9.5 Store token in Zustand on success
- [ ] 9.6 Handle validation errors
- [ ] 9.7 Handle API errors (generic message)
- [ ] 9.8 Implement redirect on success
- [ ] 9.9 Write unit tests for login page

## Implementation Details
See TechSpec "Route Structure" section for route definition and PRD "F2: User Login" for behavior.

### Relevant Files
- `frontend/src/routes/login.tsx` — New file to create

### Dependent Files
- `task_07` — Requires server functions created

## Deliverables
- Login page with form
- Inline validation errors
- Token storage in Zustand
- Success redirect
- Unit tests with 80%+ coverage (REQUIRED)

## Tests
- Unit tests:
  - [ ] Happy path: valid form submits
  - [ ] Happy path: token stored after login
  - [ ] Error path: invalid credentials shows error
  - [ ] Edge case: empty fields show required errors
- Integration tests:
  - [ ] End-to-end login flow (REQUIRED)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Token stored correctly in Zustand
