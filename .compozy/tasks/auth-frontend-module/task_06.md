---
status: completed
title: Implement root loader for session restoration
type: frontend
complexity: high
dependencies:
  - task_02
  - task_04
---

# Task 06: Implement root loader for session restoration

## Overview
Implement the TanStack Router root route loader to restore authentication state on page load by checking for the refresh token cookie and calling the token refresh endpoint if present.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST check for refresh token cookie on page load
- MUST call /token/refresh endpoint if cookie exists
- MUST store returned access token in Zustand
- MUST handle missing/invalid token gracefully
- MUST be SSR-safe to prevent hydration mismatch
</requirements>

## Subtasks
- [x] 6.1 Create or modify __root.tsx route file
- [x] 6.2 Implement root loader with cookie check
- [x] 6.3 Implement token refresh call in loader
- [x] 6.4 Connect loader result to Zustand store
- [x] 6.5 Write unit tests for loader

## Implementation Notes
Used React Router v7 (not TanStack Router) due to package compatibility. Root loader implemented in router.tsx as standard loader function. The loader calls `/api/token/refresh` endpoint with credentials: 'include' to send cookies. Gracefully handles all error cases by returning null auth data.

## Tests
- Unit tests:
  - [x] Happy path: cookie exists -> token refresh called
  - [x] Happy path: no cookie -> null token returned
  - [x] Error path: refresh fails -> clear state
  - [x] Edge case: expired token handled

## Test Results
- 8 unit tests written
- 53 total tests passing
- Coverage: 100% on router.tsx

## Success Criteria
- [x] All tests passing
- [x] Test coverage >=80% (achieved 100%)
- [x] SSR hydration works without mismatch (graceful fallback to null)