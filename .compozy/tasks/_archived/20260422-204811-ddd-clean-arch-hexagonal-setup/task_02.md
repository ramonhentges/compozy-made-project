---
status: completed
title: Shared Types & Errors
type: backend
complexity: low
dependencies:
  - task_01
---

# Task 02: Shared Types & Errors

## Overview

Create cross-module shared types and error base classes. These provide common utilities used across all bounded contexts without creating circular dependencies.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create AggregateRoot base class in src/shared/types
- MUST create DomainError and ApplicationError base classes in src/shared/errors
- MUST ensure shared layer has no domain/application imports
- MUST export all types from index.ts
</requirements>

## Subtasks
- [x] 2.1 Create AggregateRoot base class with domain events support
- [x] 2.2 Create DomainError base class with error code
- [x] 2.3 Create ApplicationError base class with status code
- [x] 2.4 Create src/shared/types/index.ts exporting all types
- [x] 2.5 Create src/shared/errors/index.ts exporting all errors

## Implementation Details

### Relevant Files
- `src/shared/types/index.ts` — Type exports
- `src/shared/errors/index.ts` — Error exports

### Dependent Files
- Domain layer entities will extend AggregateRoot
- Use cases will use error base classes

### Related ADRs
- [ADR-001: Self-contained module structure](../adrs/adr-001.md)
- [ADR-002: Domain layer isolation](../adrs/adr-002.md)

## Deliverables
- AggregateRoot class with domain events
- DomainError and ApplicationError base classes
- Index files for shared exports

## Tests
- Unit tests:
  - [x] AggregateRoot correctly manages domain events
  - [x] DomainError serialization works
  - [x] ApplicationError includes status code

## Success Criteria
- All shared exports are framework-agnostic
- No circular dependencies created
