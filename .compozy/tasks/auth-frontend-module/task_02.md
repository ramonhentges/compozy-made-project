---
status: completed
title: Configure Vite proxy and environment
type: frontend
complexity: medium
dependencies:
  - task_01
---

# Task 02: Configure Vite proxy and environment

## Overview
Configure the Vite development server proxy to forward API requests to the backend, and set up environment variables for the API base URL.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST configure Vite proxy to /api/* -> backend URL
- MUST set VITE_API_URL environment variable
- MUST handle development vs production proxy differently
</requirements>

## Subtasks
- [x] 2.1 Create frontend/.env file with VITE_API_URL
- [x] 2.2 Configure Vite proxy in vite.config.ts
- [x] 2.3 Verify proxy routes requests correctly

## Implementation Details
See TechSpec "Environment Configuration" section for configuration details.

### Relevant Files
- `frontend/.env` — Environment file (created)
- `frontend/vite.config.ts` — Vite config (already configured)

### Dependent Files
- `task_01` — Requires scaffolded frontend

## Deliverables
- Vite proxy configuration
- Environment variable setup
- Unit tests for proxy config (REQUIRED)

## Tests
- Unit tests:
  - [x] Verify proxy targets correct backend URL
  - [x] Verify environment variables load correctly
- Integration tests:
  - [ ] None at this stage
- Test coverage target: N/A
- All tests must pass

## Success Criteria
- Vite proxy forwards /api requests to backend
- Environment variable accessible at runtime