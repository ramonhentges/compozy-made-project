---
status: completed
title: Project Foundation
type: backend
complexity: medium
dependencies: []
---

# Task 01: Project Foundation

## Overview

Initialize the project with package.json, TypeScript configuration, and basic directory structure. This establishes the foundation for all subsequent implementation tasks.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create package.json with dependencies: fastify, pg-promise, bcrypt, jsonwebtoken, vitest
- MUST create tsconfig.json with strict mode enabled
- MUST configure TypeScript path aliases for @modules/*, @shared/*, @config/*
- MUST create empty directory structure per TechSpec
</requirements>

## Subtasks
- [x] 1.1 Initialize package.json with project name and all required dependencies
- [x] 1.2 Create tsconfig.json with strict mode and path aliases
- [x] 1.3 Create empty directory structure: src/modules/, src/shared/, src/config/, src/main/
- [x] 1.4 Add npm scripts: dev, build, test, test:coverage
- [x] 1.5 Create .gitignore with standard Node.js ignores

## Implementation Details

### Relevant Files
- `package.json` — Project configuration and dependencies
- `tsconfig.json` — TypeScript configuration with path aliases

### Dependent Files
- All subsequent tasks depend on this foundation

### Related ADRs
- [ADR-001: Self-contained module structure](../adrs/adr-001.md)

## Deliverables
- package.json with all dependencies installed
- tsconfig.json with strict mode and path aliases
- Empty directory structure matching TechSpec
- npm scripts for development workflow

## Tests
- Unit tests: N/A for foundation task
- Integration tests: N/A for foundation task

## Success Criteria
- npm install succeeds without errors
- TypeScript compiles without errors
- Path aliases resolve correctly