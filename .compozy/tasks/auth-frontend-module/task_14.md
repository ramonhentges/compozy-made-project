---
status: completed
title: Add name column to users table
type: infra
complexity: low
dependencies: []
---

# Task 14: Add name column to users table

## Overview
Create a migration to add the `name` column to the users table in the database.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create up migration to add name column
- MUST create down migration to remove name column
- MUST run build before migration execution
</requirements>

## Subtasks
- [ ] 14.1 Create UP migration to add name VARCHAR(255) NOT NULL
- [ ] 14.2 Create DOWN migration to drop name column
- [ ] 14.3 Run build before testing migration

## Implementation Details
Add name column to users table. See existing migration files in `backend/src/migrations/identity_context/` for naming convention.

### Relevant Files
- `backend/src/migrations/identity_context/20260418184459_initial_schema.sql` — Reference for table structure

### Dependent Files
- None — This is an independent infrastructure change

## Deliverables
- Up migration file
- Down migration file

## Tests
- Unit tests:
  - [ ] Verify migration SQL is valid
- Integration tests:
  - [ ] None at this stage
- Test coverage target: N/A
- All tests must pass

## Success Criteria
- Migration files created
- SQL is valid PostgreSQL syntax
