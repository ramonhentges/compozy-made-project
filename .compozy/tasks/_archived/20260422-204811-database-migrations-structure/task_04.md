---
status: completed
title: Add migration scripts to package.json for Identity context
type: backend
complexity: low
dependencies:
  - task_01
  - task_03
---

# Task 4: Add migration scripts to package.json for Identity context

## Overview
Add context-specific npm scripts to package.json for executing migrations against the Identity bounded context's dedicated database. This enables developers to run migrations for the Identity context independently without affecting other contexts.

## <critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

## <requirements>
- MUST add `migrate:identity_context` script to package.json
- MUST add `migrate:identity_context:up` and `migrate:identity_context:down` scripts
- MUST ensure scripts use the correct migration folder and database config
- SHOULD follow existing npm script naming conventions in the project
- SHOULD provide helpful error messages if configuration is missing

## ## Subtasks
- [ ] 4.1 Add migration scripts to package.json
- [ ] 4.2 Verify scripts reference correct migration folder
- [ ] 4.3 Test that scripts can be executed (will fail gracefully without DB)
- [ ] 4.4 Document usage in README or comments

## ## Implementation Details
- File to modify: `package.json` (scripts section)
- Integration points: Will use migration configuration from task_03
- No new files needed, only modifications to existing package.json

### ### Relevant Files
- `package.json` — Where migration scripts will be added
- `src/config/databases/identity_context.ts` — Provides DB config for scripts
- `src/migrations/identity_context/` — Target migration folder for scripts

### ### Dependent Files
- Migration configuration — Scripts will depend on this being set up correctly
- Migration folder — Scripts will target this directory
- Developers — Will use these scripts in their workflow

### ### Related ADRs
- [ADR-005: Migration Execution Approach](../adrs/adr-005.md) — Decided to provide context-specific migration commands in package.json

## ## Deliverables
- Updated package.json with identity context migration scripts
- Verification that scripts reference correct paths and configurations
- Documentation of how to use the migration scripts
- Unit tests validating script structure (though actual execution requires DB)

## ## Tests
- Unit tests:
  - [ ] package.json contains migrate:identity_context script
  - [ ] package.json contains migrate:identity_context:up script
  - [ ] package.json contains migrate:identity_context:down script
  - [ ] Scripts reference correct migration folder path
  - [ ] Scripts reference correct configuration mechanism
- Integration tests:
  - [ ] Scripts can be parsed and executed (will validate configuration)
  - [ ] Help output or error messages are appropriate when config missing
- Test coverage target: >=80%
- All tests must pass

## ## Success Criteria
- All tests passing
- Test coverage >=80%
- Migration scripts correctly added to package.json
- Scripts reference proper migration folder and configuration
- Scripts are usable by developers for Identity context migrations