---
status: completed
title: Create auth store with Zustand
type: frontend
complexity: medium
dependencies:
    - task_03
---

# Task 04: Create auth store with Zustand

## Overview
Create the Zustand store for managing authentication state (access token and user data) on the client side. This store uses the skipHydration pattern for SSR safety.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement User interface with id, email, name
- MUST implement AuthState with accessToken, user, setAuth, clearAuth
- MUST use skipHydration pattern for SSR safety
- MUST NOT store tokens in localStorage (memory only per security requirements)
</requirements>

## Subtasks
- [ ] 4.1 Create frontend/src/stores/ directory
- [ ] 4.2 Implement User interface
- [ ] 4.3 Implement AuthState interface with setAuth, clearAuth
- [ ] 4.4 Create useAuthStore with skipHydration
- [ ] 4.5 Write unit tests for store

## Implementation Details
See TechSpec "Core Interfaces" section for the auth store interface definition.

### Relevant Files
- `frontend/src/stores/auth.store.ts` — New file to create
- ADR-002: Access Token Storage — Store pattern

### Dependent Files
- `task_03` — Requires installed Zustand package

### Related ADRs
- [ADR-002: Access Token Storage](../adrs/adr-002.md) — Use Zustand store with client-only middleware

## Deliverables
- Auth store with User and AuthState interfaces
- Unit tests with 80%+ coverage (REQUIRED)

## Tests
- Unit tests:
  - [ ] Happy path: setAuth updates token and user
  - [ ] Happy path: clearAuth clears token and user
  - [ ] Edge case: initial state is null
  - [ ] Edge case: multiple setAuth calls replace previous
- Integration tests:
  - [ ] None at this stage
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- Hydration works without mismatch
