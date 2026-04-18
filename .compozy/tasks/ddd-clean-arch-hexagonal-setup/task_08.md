---
status: completed
title: Unit Tests
type: test
complexity: medium
dependencies:
  - task_07
---

# Task 08: Unit Tests

## Overview

Implement comprehensive unit tests for domain and application layers. Tests must run without any database or HTTP framework dependencies, demonstrating the isolation of domain logic.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create unit tests for domain entities and value objects
- MUST create unit tests for application use case handlers
- MUST use mocks for all port interfaces
- MUST achieve >=80% test coverage for domain and application layers
- MUST run tests without any database or HTTP framework
</requirements>

## Subtasks
- [x] 8.1 Write unit tests for User entity (creation, getters, domain events)
- [x] 8.2 Write unit tests for Email value object (validation)
- [x] 8.3 Write unit tests for UserId value object (validation)
- [x] 8.4 Write unit tests for RegisterUserHandler with mock ports
- [x] 8.5 Write unit tests for LoginUserHandler with mock ports
- [x] 8.6 Write unit tests for LogoutUserHandler with mock ports
- [x] 8.7 Run coverage and ensure >=80%

## Implementation Details

### Relevant Files
- `src/modules/identity/domain/entities/user.test.ts`
- `src/modules/identity/domain/value_objects/email.test.ts`
- `src/modules/identity/domain/value_objects/user_id.test.ts`
- `src/modules/identity/application/register_user/handler.test.ts`
- `src/modules/identity/application/login_user/handler.test.ts`
- `src/modules/identity/application/logout_user/handler.test.ts`

### Dependent Files
- Tests verify the implementations from previous tasks

### Related ADRs
- [ADR-002: Domain layer isolation](../adrs/adr-002.md)

## Deliverables
- Unit tests for all domain entities and value objects
- Unit tests for all application use case handlers
- Test coverage report showing >=80%

## Tests
- Unit tests:
  - [x] User.create() publishes UserRegisteredEvent
  - [x] Email rejects invalid formats with InvalidEmailError
  - [x] Email accepts valid formats
  - [x] UserId rejects non-UUID values with InvalidUserIdError
  - [x] RegisterUserHandler creates user on valid input
  - [x] RegisterUserHandler throws on duplicate email
  - [x] LoginUserHandler returns tokens on valid credentials
  - [x] LoginUserHandler throws InvalidCredentialsError on bad password
  - [x] LogoutUserHandler invalidates session
- Integration tests: N/A (unit tests run standalone)

## Success Criteria
- All tests pass without database or HTTP dependencies
- Test coverage >=80% for domain and application layers