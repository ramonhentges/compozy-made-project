# AGENTS.md

This file provides project guidance for coding agents working in this repository.

## HIGH PRIORITY

- **IF YOU DON'T CHECK SKILLS** your task will be invalidated and we will generate rework
- **YOU CAN ONLY** finish a task if `npm run test` passes with 100% passing tests. No exceptions — failing tests means the task is **NOT COMPLETE**
- **`npm run lint` has zero tolerance**. **Zero issues allowed** — any ESLint/TypeScript issue is a blocking failure
- **ALWAYS** check dependent package APIs before writing integration code or tests to avoid writing wrong code
- **NEVER** use workarounds — always use the `no-workarounds` skill for any fix/debug task + `testing-anti-patterns` for tests
- **ALWAYS USE** the `no-workarounds` and `systematic-debugging` skills when fixing bugs or complex issues
- **NEVER** use web search tools to search local project code — for local code, use Grep/Glob instead
- **YOU SHOULD NEVER** add dependencies by hand in `package.json` — always use `npm install` instead

## MANDATORY REQUIREMENTS

- **MUST** run `npm run test` before completing ANY subtask
- **ALWAYS USE** the `typescript-advanced` skill before writing TypeScript code
- **ALWAYS USE** the `systematic-debugging` + `no-workarounds` skills before fixing any bug
- **ALWAYS USE** the `testing-anti-patterns` skill before writing or modifying tests
- **ALWAYS USE** the `cy-final-verify` skill before claiming any task is done
- **ALWAYS USE** the `clean-ddd-hexagonal` skill for any DDD, Clean Architecture, or Hexagonal Architecture work
- **Skipping any verification check will result in IMMEDIATE TASK REJECTION**

## Project Overview

This is a TypeScript/Node.js backend implementing **Domain-Driven Design (DDD)**, **Clean Architecture**, and **Hexagonal Architecture (Ports and Adapters)** patterns. It uses Fastify for the HTTP layer and PostgreSQL via pg-promise for persistence.

## Architecture

### Domain Structure

| Path                                            | Responsibility                                            |
| ----------------------------------------------- | --------------------------------------------------------- |
| `src/modules/<bounded-context>/domain/`         | Domain entities, value objects, aggregates, domain events |
| `src/modules/<bounded-context>/application/`    | Use cases, application services, command/query handlers   |
| `src/modules/<bounded-context>/infrastructure/` | Adapters: repositories, external services, persistence    |
| `src/shared/`                                   | Shared types, errors, utilities across bounded contexts   |
| `src/config/`                                   | Configuration, database connections, environment          |
| `src/main/`                                     | Application entry point, HTTP server setup                |

### Architectural Principles

- **Domain layer** has zero dependencies on external frameworks
- **Application layer** depends only on domain layer
- **Infrastructure layer** implements interfaces defined in domain/application
- **Ports (interfaces)** live in the domain or application layer
- **Adapters** live in the infrastructure layer

## Build & Development Commands

```bash
# Full verification pipeline (BLOCKING GATE for any change)
npm run test              # Run all tests with vitest

# Individual steps
npm run build             # Compile TypeScript
npm run test              # Run tests with vitest
npm run test:coverage     # Run tests with coverage

# Database migrations
npm run migrate:identity_context:up   # Run pending migrations
npm run migrate:identity_context:down # Rollback last migration

# Development
npm run dev               # Run with ts-node (watch mode)
```

## CRITICAL: Git Commands Restriction

- **ABSOLUTELY FORBIDDEN**: **NEVER** run `git restore`, `git checkout`, `git reset`, `git clean`, `git rm`, or any other git commands that modify or discard working directory changes **WITHOUT EXPLICIT USER PERMISSION**
- **DATA LOSS RISK**: These commands can **PERMANENTLY LOSE CODE CHANGES** and cannot be easily recovered
- **REQUIRED ACTION**: If you need to revert or discard changes, **YOU MUST ASK THE USER FIRST**
- If the worktree contains unexpected edits, read them and work around them; do not revert them

## Code Search and Discovery

- **TOOL HIERARCHY**: Use tools in this order:
  1. **Grep** / **Glob** — preferred for local project code
  2. **`find-skills` skill** — for external TypeScript/Node.js library documentation
  3. **Web search tools** — for web research, latest news, code examples
- **FORBIDDEN**: Never use web search tools for local project code

## Coding Style

- Format with `npm run build` (runs `tsc --noEmit` for type checking)
- Use explicit error handling with typed errors from `src/shared/errors/`
- Design small, focused interfaces; accept interfaces, return concrete types
- Use dependency injection for infrastructure dependencies
- Do not use `any` when a concrete type is known
- Do not use reflection without performance justification
- Keep JSDoc comments short and focused on intent, invariants, or protocol edge cases

## Testing

- Table-driven tests as the default pattern
- Use `describe`/`it` blocks with `test.each()` for data-driven tests
- Use `t.TempDir()` for filesystem isolation
- Mock dependencies via interfaces, not test-only stubs in production code
- Place test files alongside source files with `.test.ts` suffix
- Use path aliases: `@modules`, `@shared`, `@config`

## Anti-Patterns for Agents

**NEVER do these:**

1. **Skip skill activation** because "it's a small change" — every domain change requires its skill
2. **Activate only one skill** when the code touches multiple domains
3. **Forget `cy-final-verify`** before marking tasks done
4. **Write tests without `testing-anti-patterns`** — leads to mock-testing-mocks and production pollution
5. **Fix bugs without `systematic-debugging`** — leads to symptom-patching instead of root cause fixes
6. **Apply workarounds without `no-workarounds`** — type assertions, lint suppressions, error swallowing are rejected
7. **Claim task is done when any check has warnings or errors** — zero warnings, zero errors. No exceptions
8. **Add dependencies by hand in package.json** — always use `npm install`
9. **Use web search tools for local code** — only for external library documentation
10. **Run destructive git commands without permission** — `git restore`, `git reset`, `git clean` require explicit user approval
11. **Import infrastructure in domain layer** — domain must be framework-agnostic
12. **Use `setTimeout`/`setInterval` in orchestration** — use proper synchronization primitives instead
13. **Ignore errors with `_`** — every error must be handled or have a written justification
14. **Hardcode configuration** — use config module or environment variables
