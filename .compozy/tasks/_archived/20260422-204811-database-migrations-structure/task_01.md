---
status: completed
title: Set up migration tooling with node-pg-migrate
type: backend
complexity: medium
dependencies: []
---

# Task 1: Set up migration tooling with node-pg-migrate

## Overview
Install and configure node-pg-migrate as the migration tooling framework for the project. This involves adding the dependency to package.json and creating configuration templates that will be used by each bounded context for their dedicated database migrations.

## <critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

## <requirements>
- MUST install node-pg-migrate as a development dependency
- MUST create a configuration template for database connections
- MUST ensure compatibility with existing pg-promise usage
- SHOULD follow existing codebase organization patterns
</requirements>

## ## Subtasks
- [x] 1.1 Add node-pg-migrate to devDependencies in package.json
- [x] 1.2 Create migration configuration template file
- [x] 1.3 Verify installation and basic functionality

## ## Implementation Details
- File paths to modify: `package.json`
- New files to create: `src/config/migration-config.ts` (template)
- Integration points: Existing database configuration in `src/config/index.ts`

### ### Relevant Files
- `package.json` — Project manifest where dependencies are managed
- `src/config/index.ts` — Existing configuration loading mechanism
- `src/modules/identity/infrastructure/persistence/config/db_config.ts` — Current database config

### ### Dependent Files
- `src/config/index.ts` — Will need to import migration config
- `package.json` — Dependency installation affects all developers

### ### Related ADRs
- [ADR-002: Migration Tooling Selection](../adrs/adr-002.md) — Selected node-pg-migrate as the migration tooling framework

## ## Deliverables
- Updated `package.json` with node-pg-migrate in devDependencies
- New configuration template file `src/config/migration-config.ts`
- Unit tests verifying configuration loading (80%+ coverage)
- Integration tests confirming migration tool can be instantiated

## ## Tests
- Unit tests:
  - [x] Configuration template loads correctly with environment variables
  - [x] Migration tool instantiation works with test database config
  - [x] Default values are handled appropriately
- Integration tests:
  - [x] Verify migration tool can connect to test database (if available)
  - [x] Test that migration commands can be executed successfully
- Test coverage target: >=80%
- All tests must pass

## ## Success Criteria
- [x] All tests passing
- [x] Test coverage >=80%
- [x] node-pg-migrate successfully installed and configured
- [x] Migration tool can be instantiated with configuration template