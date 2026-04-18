---
status: completed
title: Identity Application Layer
type: backend
complexity: medium
dependencies:
    - task_03
---

# Task 04: Identity Application Layer

## Overview

Implement use case handlers for registration, login, and logout. The application layer orchestrates domain logic, depends only on the domain layer, and defines driver ports for infrastructure adapters.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create RegisterUser command, handler, and port interface
- MUST create LoginUser command, handler, and port interface
- MUST create LogoutUser handler and port interface
- MUST depend ONLY on domain layer (no infrastructure imports)
- MUST handle all error cases with proper error types
</requirements>

## Subtasks
- [ ] 4.1 Create RegisterUserCommand and RegisterUserResult DTOs
- [ ] 4.2 Create IRegisterUserUseCase port interface
- [ ] 4.3 Create RegisterUserHandler with business logic
- [ ] 4.4 Create LoginUserCommand and LoginUserResult DTOs
- [ ] 4.5 Create ILoginUserUseCase port interface
- [ ] 4.6 Create LoginUserHandler with authentication logic
- [ ] 4.7 Create ILogoutUserUseCase port interface
- [ ] 4.8 Create LogoutUserHandler with session invalidation

## Implementation Details

### Relevant Files
- `src/modules/identity/application/register_user/command.ts`
- `src/modules/identity/application/register_user/port.ts`
- `src/modules/identity/application/register_user/handler.ts`
- `src/modules/identity/application/login_user/command.ts`
- `src/modules/identity/application/login_user/port.ts`
- `src/modules/identity/application/login_user/handler.ts`
- `src/modules/identity/application/logout_user/port.ts`
- `src/modules/identity/application/logout_user/handler.ts`

### Dependent Files
- HTTP controllers will depend on use case interfaces
- Infrastructure adapters will implement the ports

### Related ADRs
- [ADR-001: Self-contained module structure](../adrs/adr-001.md)
- [ADR-003: Ports & Adapters inside module](../adrs/adr-003.md)
- [ADR-004: Manual Dependency Injection](../adrs/adr-004.md)

## Deliverables
- RegisterUser use case with command, result, port, handler
- LoginUser use case with command, result, port, handler
- LogoutUser use case with port and handler

## Tests
- Unit tests:
  - [ ] RegisterUser creates user with hashed password
  - [ ] RegisterUser rejects duplicate email
  - [ ] LoginUser returns tokens on valid credentials
  - [ ] LoginUser throws on invalid credentials
  - [ ] LogoutUser validates session
- Integration tests: N/A for application layer

## Success Criteria
- Handlers work with mock domain ports only
- No infrastructure imports in use cases
