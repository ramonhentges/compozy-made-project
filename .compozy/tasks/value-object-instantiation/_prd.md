# Value Object Instantiation Pattern

## Overview

Refactor the value object and entity creation pattern to enable mappers to instantiate domain objects directly from database data without redundant validation, and add auto-generation capability for ID-type value objects. This change affects all value objects and entities across all modules in the codebase.

## Goals

- Enable mappers to use constructors directly for pre-validated data from database
- Add parameterless `create()` method for ID-type value objects to auto-generate UUID v4
- Maintain validation in use case layer via static `create(value)` methods
- Apply changes uniformly across all modules (identity, attendances, etc.)

## User Stories

### As a Developer Working with Mappers

- I want to instantiate value objects from database DTOs without re-running validation
- So that mapper performance improves and code is clearer

### As a Developer Creating New Entities

- I want to generate unique IDs automatically for new entities
- So that I don't have to manually create UUIDs for every new record

### As a Developer Working with Entities

- I want entities to have public constructors for reconstruction from database
- So that mappers can instantiate entities without factory methods

### As a System Architect

- I want consistent value object patterns across all modules
- So that onboarding new developers is easier and code is predictable

## Core Features

### Feature 1: Public Constructors for Value Objects and Entities

- Change all value object constructors from private to public
- Change all entity constructors from private to public (where applicable)
- Enables direct instantiation in mappers
- Existing static create() methods remain for validation

### Feature 2: Parameterless create() for ID Types

- UserId.create() (no args) generates a new UUID v4
- Applies to all ID-type value objects in all modules
- Maintains validation for create(value) variant

### Feature 3: Mapper Updates

- Update all mappers to use constructors instead of create() for DTO conversion
- Mappers skip validation since data is already validated from database

### Feature 4: Validation Preservation

- Use cases continue using create(value) for input validation
- Ensures all external input is validated before domain object creation

## User Experience

This is an internal developer experience improvement. No end-user facing changes.

## High-Level Technical Constraints

- Must maintain backward compatibility for existing code using create()
- All value objects across all modules must follow the same pattern
- No database schema changes required

## Non-Goals

- Changing repository interfaces
- Adding new value objects or entities
- Modifying domain events or other domain components

## Phased Rollout Plan

### MVP (Phase 1)

- Update UserId, Email, Password value objects in identity module
- Update UserMapper to use constructors
- Verify tests pass

### Phase 2

- Identify all other value objects across all modules
- Update each module following the same pattern

### Phase 3

- Update all remaining mappers to use constructors
- Full test coverage verification

## Success Metrics

- All existing tests pass
- Mappers use constructors for toDomain operations
- Use cases continue using create() for validation

## Risks and Mitigations

### Risk: Developers use constructors without validation in use cases

- **Mitigation**: Code review and linting rules to enforce create() usage in application layer

### Risk: Inconsistent application across modules

- **Mitigation**: Create documentation in shared codebase conventions

### Risk: Test coverage gaps for constructor path

- **Mitigation**: Add specific tests for constructor instantiation

## Architecture Decision Records

- [ADR-001: Value Object Instantiation Pattern](adrs/adr-001.md) — Defines constructor visibility and create() method behavior

## Open Questions

- Should there be a lint rule to enforce create() in application layer?
- How to handle value objects that need different ID generation strategies?