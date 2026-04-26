---
status: completed
title: Create auth server functions (register, login, logout, refresh)
type: frontend
complexity: high
dependencies:
    - task_02
    - task_05
---

# Task 07: Create auth server functions (register, login, logout, refresh)

## Overview
Create TanStack Start server functions to call backend authentication endpoints. These server functions handle API communication with the backend and use the shared Zod schemas for input validation.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement registerFn calling POST /register
- MUST implement loginFn calling POST /login
- MUST implement logoutFn calling POST /logout
- MUST implement refreshFn calling POST /token/refresh
- MUST use createServerFn for SSR compatibility
- MUST handle error responses with proper error messages
</requirements>

## Subtasks
- [ ] 7.1 Create frontend/src/api/auth.functions.ts file
- [ ] 7.2 Implement registerFn with Zod validation
- [ ] 7.3 Implement loginFn with Zod validation
- [ ] 7.4 Implement logoutFn
- [ ] 7.5 Implement refreshFn
- [ ] 7.6 Handle API errors gracefully
- [ ] 7.7 Write unit tests for server functions

## Implementation Details
See TechSpec "API Endpoints" section for endpoint definitions and ADR-004: API Calls via createServerFn Proxy.

### Relevant Files
- `frontend/src/api/auth.functions.ts` — New file to create
- ADR-004: API Calls via createServerFn Proxy — Pattern

### Dependent Files
- `task_02` — Requires Vite proxy configured
- `task_05` — Requires Zod schemas

### Related ADRs
- [ADR-004: API Calls via createServerFn Proxy](../adrs/adr-004.md) — TanStack createServerFn with Vite proxy for type-safe backend integration

## Deliverables
- Server functions for all 4 auth endpoints
- Proper error handling
- Unit tests with 80%+ coverage (REQUIRED)

## Tests
- Unit tests:
  - [ ] Happy path: registerFn calls correct endpoint
  - [ ] Happy path: loginFn calls correct endpoint
  - [ ] Happy path: logoutFn calls correct endpoint
  - [ ] Happy path: refreshFn calls correct endpoint
  - [ ] Error path: API error handled gracefully
  - [ ] Edge case: network error handled
- Integration tests:
  - [ ] End-to-end register flow (REQUIRED)
  - [ ] End-to-end login flow (REQUIRED)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Server functions call correct endpoints
