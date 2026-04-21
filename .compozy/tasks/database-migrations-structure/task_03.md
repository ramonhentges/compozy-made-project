---
status: completed
title: Configure Identity context database connection
type: backend
complexity: medium
dependencies:
    - task_01
---

# Task 3: Configure Identity context database connection

## Overview
Set up a dedicated database connection configuration for the Identity bounded context. This involves creating environment-specific configuration that points to a dedicated database instance for the Identity context, ensuring isolation from other bounded contexts' databases.

## <critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

## <requirements>
- MUST create database configuration specific to Identity context
- MUST use environment variables for database connection (e.g., IDENTITY_DATABASE_URL)
- MUST ensure configuration is isolated from other bounded contexts
- SHOULD follow existing configuration patterns in the codebase
- SHOULD provide sensible defaults for development

## ## Subtasks
- [ ] 3.1 Create Identity context database configuration
- [ ] 3.2 Define environment variables for Identity database connection
- [ ] 3.3 Integrate with existing configuration system
- [ ] 3.4 Validate configuration loading

## ## Implementation Details
- New file to create: `src/config/databases/identity_context.ts`
- Files to modify: `src/config/index.ts` (to import and export identity config)
- Integration points: Migration tooling will use this configuration

### ### Relevant Files
- `src/config/databases/identity_context.ts` — New Identity database config
- `src/config/index.ts` — Main configuration aggregation point
- `src/modules/identity/infrastructure/persistence/config/db_config.ts` — Existing identity db config (to be updated/refactored)
- `src/config/migration-config.ts` — Will use this config for migrations

### ### Dependent Files
- Existing identity database config — May need refactoring to use new structure
- Migration configuration — Will depend on this config
- Application code using database — May need updates if db config changes

### ### Related ADRs
- [ADR-001: Migrations Structure for Bounded Contexts](../adrs/adr-001.md) — Defined the folder structure approach
- [ADR-003: Shared Data Handling Approach for Separate Databases](../adrs/adr-003.md) — Chose service API approach for cross-context data access

## ## Deliverables
- Identity context database configuration file
- Updated main configuration to include Identity database config
- Documentation of required environment variables
- Unit tests verifying configuration loads correctly from environment
- Integration tests confirming config can be used by migration tooling

## ## Tests
- Unit tests:
  - [ ] Identity database config loads from environment variables
  - [ ] Configuration provides sensible defaults for development
  - [ ] Configuration validation works correctly
  - [ ] Config is properly isolated from other contexts
- Integration tests:
  - [ ] Migration tooling can use this configuration to connect to database
  - [ ] Config works with existing pg-promise setup (if retained)
- Test coverage target: >=80%
- All tests must pass

## ## Success Criteria
- All tests passing
- Test coverage >=80%
- Identity context has isolated database configuration
- Configuration follows existing patterns and conventions
- Environment variables are properly documented and used
