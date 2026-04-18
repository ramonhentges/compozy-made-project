---
status: completed
title: Identity Domain Layer
type: backend
complexity: high
dependencies:
  - task_02
---

# Task 03: Identity Domain Layer

## Overview

Implement the core domain logic for the Identity bounded context: User entity, value objects (Email, Password, UserId), repository interfaces, and domain services. This is the heart of the application with zero external dependencies.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create User aggregate root with domain events
- MUST create Email, Password, UserId value objects with validation
- MUST define IUserRepository driven port interface
- MUST define IPasswordHasher and ITokenService domain service interfaces
- MUST create UserNotFoundError and InvalidCredentialsError
- MUST ensure domain layer has ZERO external imports (per ADR-002)
</requirements>

## Subtasks
- [x] 3.1 Create UserId value object with UUID validation
- [x] 3.2 Create Email value object with email format validation
- [x] 3.3 Create Password value object (stores hash only)
- [x] 3.4 Create User aggregate root with domain events
- [x] 3.5 Create IUserRepository port interface in domain/repository
- [x] 3.6 Create IPasswordHasher interface in domain/services
- [x] 3.7 Create ITokenService interface in domain/services
- [x] 3.8 Create domain error classes
- [x] 3.9 Create UserRegistered domain event

## Implementation Details

### Relevant Files
- `src/modules/identity/domain/entities/user.ts` — User aggregate
- `src/modules/identity/domain/value_objects/email.ts` — Email VO
- `src/modules/identity/domain/value_objects/user_id.ts` — UserId VO
- `src/modules/identity/domain/repository/user_repository.ts` — IUserRepository
- `src/modules/identity/domain/services/password_hasher.ts` — IPasswordHasher
- `src/modules/identity/domain/services/token_service.ts` — ITokenService

### Dependent Files
- Application layer use cases will depend on these interfaces

### Related ADRs
- [ADR-001: Self-contained module structure](../adrs/adr-001.md)
- [ADR-002: Domain layer isolation](../adrs/adr-002.md)
- [ADR-003: Ports & Adapters inside module](../adrs/adr-003.md)

## Deliverables
- User entity with domain events
- All value objects with validation
- Repository interfaces (driven ports)
- Domain service interfaces
- Domain error classes
- Domain event for user registration

## Tests
- Unit tests:
  - [x] User.create() generates UserRegisteredEvent
  - [x] Email validation rejects invalid formats
  - [x] Email validation accepts valid formats
  - [x] UserId validation rejects non-UUID values
  - [x] User aggregate has correct getters
- Integration tests: N/A for pure domain

## Success Criteria
- Domain layer has ZERO imports from outside domain
- All validation logic tested
- Domain events fire on user creation