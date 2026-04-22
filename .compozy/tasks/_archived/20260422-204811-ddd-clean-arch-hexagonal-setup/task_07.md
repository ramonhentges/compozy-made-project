---
status: completed
title: Composition Root (DI)
type: backend
complexity: low
dependencies:
  - task_06
---

# Task 07: Composition Root (DI)

## Overview

Wire all dependencies together in the composition root. This is the single location where all adapters are instantiated and injected into use cases, following manual dependency injection per ADR-004.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create main/index.ts as composition root
- MUST wire all use case handlers with their port implementations
- MUST create Fastify server instance with all routes
- MUST load environment configuration
- MUST export all wired instances for testing
</requirements>

## Subtasks
- [x] 7.1 Create src/config/index.ts for environment config
- [x] 7.2 Create src/main/index.ts as composition root
- [x] 7.3 Instantiate all adapters and inject into handlers
- [x] 7.4 Register Fastify routes with server
- [x] 7.5 Add graceful shutdown handling

## Implementation Details

### Relevant Files
- `src/config/index.ts` — Environment configuration
- `src/main/index.ts` — Composition root, server setup

### Dependent Files
- package.json scripts will reference main/index.ts

### Related ADRs
- [ADR-004: Manual Dependency Injection](../adrs/adr-004.md)

## Deliverables
- Config module loading environment variables
- Composition root wiring all dependencies
- Server startup function

## Tests
- Unit tests:
  - [x] Config loads required env vars
- Integration tests:
  - [x] Server starts and responds to health check

## Success Criteria
- All dependencies wired correctly
- Server starts without errors