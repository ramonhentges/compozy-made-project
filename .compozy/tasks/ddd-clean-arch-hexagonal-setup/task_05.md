---
status: completed
title: Identity Infrastructure Adapters
type: backend
complexity: medium
dependencies:
  - task_04
---

# Task 05: Identity Infrastructure Adapters

## Overview

Implement the adapters that connect the domain and application layers to external systems: PostgreSQL repository, bcrypt password hashing, and JWT token service.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement IUserRepository using pg-promise
- MUST implement IPasswordHasher using bcrypt with 12 rounds
- MUST implement ITokenService using JWT with HS256
- MUST implement user mapper for entity <-> database mapping
- MUST create database configuration for pg-promise
</requirements>

## Subtasks
- [x] 5.1 Implement UserRepository with pg-promise
- [x] 5.2 Implement UserMapper for entity/DTO conversion
- [x] 5.3 Implement BcryptAdapter for password hashing
- [x] 5.4 Implement JwtAdapter for token management
- [x] 5.5 Create database configuration

## Implementation Details

### Relevant Files
- `src/modules/identity/infrastructure/persistence/repositories/user_repository.ts`
- `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts`
- `src/modules/identity/infrastructure/persistence/config/db_config.ts`
- `src/modules/identity/infrastructure/adapters/bcrypt_adapter.ts`
- `src/modules/identity/infrastructure/adapters/jwt_adapter.ts`

### Dependent Files
- HTTP controllers will use these adapters

### Related ADRs
- [ADR-003: Ports & Adapters inside module](../adrs/adr-003.md)
- [ADR-005: JWT Token Session Management](../adrs/adr-005.md)
- [ADR-006: pg-promise for persistence](../adrs/adr-006.md)
- [ADR-007: Domain Password Hashing](../adrs/adr-007.md)

## Deliverables
- UserRepository implementation with full CRUD
- BcryptAdapter with 12 rounds
- JwtAdapter with access/refresh token generation
- UserMapper for database mapping

## Tests
- Unit tests:
  - [x] UserRepository.findByEmail returns user or null
  - [x] UserRepository.save creates new user
  - [x] BcryptAdapter correctly hashes and verifies
  - [x] JwtAdapter generates and verifies tokens
- Integration tests: N/A for adapters (tested via HTTP flow)

## Success Criteria
- All adapter implementations satisfy their port interfaces
- Database config handles connection pool