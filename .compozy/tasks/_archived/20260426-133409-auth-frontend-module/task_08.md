---
status: completed
title: Create registration form page
type: frontend
complexity: medium
dependencies:
  - task_07
---

# Task 08: Create registration form page

## Overview
Create the registration page (/register) with a form using React Hook Form and Zod validation. The form includes email, name, and password fields with inline validation errors.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create /register route
- MUST include email, name, password fields
- MUST use React Hook Form with Zod resolver
- MUST display inline validation errors
- MUST call registerFn on submit
- MUST handle "email already registered" error
- MUST redirect to /login on success
</requirements>

## Subtasks
- [x] 8.1 Create frontend/src/routes/register.tsx
- [x] 8.2 Implement form with React Hook Form
- [x] 8.3 Add fields with shadcn components
- [x] 8.4 Connect form to registerFn
- [x] 8.5 Handle validation errors
- [x] 8.6 Handle API errors
- [x] 8.7 Implement redirect on success
- [x] 8.8 Write unit tests for register page

## Implementation Details
See TechSpec "Route Structure" section for route definition and PRD "F1: User Registration" for behavior.

### Relevant Files
- `frontend/src/routes/register.tsx` — New file to create

### Dependent Files
- `task_07` — Requires server functions created

## Deliverables
- Registration page with form
- Inline validation errors
- Success redirect
- Unit tests with 80%+ coverage (REQUIRED)

## Tests
- Unit tests:
  - [ ] Happy path: valid form submits
  - [ ] Happy path: validation errors show on blur
  - [ ] Error path: email already registered shows error
  - [ ] Edge case: empty fields show required errors
  - [ ] Edge case: weak password shows error
- Integration tests:
  - [ ] End-to-end register flow (REQUIRED)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Form validates all fields correctly