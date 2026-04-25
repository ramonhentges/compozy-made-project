# CLAUDE.md

This file provides project guidance for coding agents working in this repository.

## HIGH PRIORITY

- **IF YOU DON'T CHECK SKILLS** your task will be invalidated and we will generate rework
- **YOU CAN ONLY** finish a task if `npm run test` passes (runs tests with coverage). No exceptions — failing tests means the task is **NOT COMPLETE**
- **`npm run test` has zero tolerance**. **Zero test failures allowed** — any test failure is a blocking failure
- **ALWAYS** check dependent package APIs before writing integration code or tests to avoid writing wrong code
- **NEVER** use workarounds — always use the `no-workarounds` skill for any fix/debug task + `testing-anti-patterns` for tests
- **ALWAYS USE** the `no-workarounds` and `systematic-debugging` skills when fixing bugs or complex issues
- **NEVER** use web search tools to search local project code — for local code, use Grep/Glob instead
- **YOU SHOULD NEVER** add dependencies by hand in `package.json` — always use `npm install` instead

## MANDATORY REQUIREMENTS

- **MUST** run `npm run test` before completing ANY subtask
- **ALWAYS USE** the `systematic-debugging` + `no-workarounds` skills before fixing any bug
- **ALWAYS USE** the `testing-anti-patterns` skill before writing or modifying tests
- **ALWAYS USE** the `cy-final-verify` skill before claiming any task is done
- **Skipping any verification check will result in IMMEDIATE TASK REJECTION**

## Project Overview

Compozy is a full-stack application with Node.js/TypeScript backend and React frontend. The backend is built with TypeScript using Fastify, following DDD + Clean Architecture + Hexagonal patterns. It covers product ideation (PRD creation), technical specification, task breakdown with codebase-informed enrichment, and automated execution of each task via AI coding agents.

## Package Layout

### Backend (`backend/`)

| Path                                            | Responsibility                                            |
| ----------------------------------------------- | --------------------------------------------------------- |
| `src/modules/<bounded-context>/domain/`         | Domain entities, value objects, aggregates, domain events |
| `src/modules/<bounded-context>/application/`    | Use cases, application services, command/query handlers   |
| `src/modules/<bounded-context>/infrastructure/` | Adapters: repositories, external services, persistence    |
| `src/shared/`                                   | Shared types, errors, utilities across bounded contexts   |
| `src/config/`                                   | Configuration, database connections, environment          |
| `src/main/`                                     | Application entry point, HTTP server setup                |

#### Architectural Principles

- **Domain layer** has zero dependencies on external frameworks
- **Application layer** depends only on domain layer
- **Infrastructure layer** implements interfaces defined in domain/application
- **Ports (interfaces)** live in the domain or application layer
- **Adapters** live in the infrastructure layer

### Frontend (`frontend/`)

| Path                      | Responsibility                |
| ------------------------- | ----------------------------- |
| `frontend/src`            | React application source      |
| `frontend/src/components` | Reusable UI components        |
| `frontend/src/pages`      | Route pages                   |
| `frontend/src/hooks`      | Custom React hooks            |
| `frontend/src/lib`        | Utility functions             |
| `frontend/src/stores`     | Zustand state stores          |
| `frontend/src/api`        | API client / server functions |

## Build & Development Commands

### Backend (`backend/`)

```bash
# Full verification pipeline (BLOCKING GATE for any change)
npm run test            # Run tests with coverage

# Individual steps
npm run build           # TypeScript compilation

# Migrations
npm run migrate:identity_context:up    # Run migrations up
npm run migrate:identity_context:down  # Run migrations down
```

### Frontend (`frontend/`) - TBD

```bash
# To be determined when frontend is scaffolded
npm run dev             # Development server
npm run build           # Production build
npm run test            # Run tests
npm run lint            # Lint & format check
```

## CRITICAL: Git Commands Restriction

- **ABSOLUTELY FORBIDDEN**: **NEVER** run `git restore`, `git checkout`, `git reset`, `git clean`, `git rm`, or any other git commands that modify or discard working directory changes **WITHOUT EXPLICIT USER PERMISSION**
- **DATA LOSS RISK**: These commands can **PERMANENTLY LOSE CODE CHANGES** and cannot be easily recovered
- **REQUIRED ACTION**: If you need to revert or discard changes, **YOU MUST ASK THE USER FIRST**
- If the worktree contains unexpected edits, read them and work around them; do not revert them

## Code Search and Discovery

- **TOOL HIERARCHY**: Use tools in this order:
  1. **Grep** / **Glob** — preferred for local project code
  2. **context7 mcp tool** — for external library documentation
  3. **Web search tools** — for web research, latest news, code examples
- **FORBIDDEN**: Never use web search tools for local project code

## Coding Style

- Format with the project's formatting tooling.
- Prefer explicit error returns with wrapped context.
- Use proper error handling patterns; avoid comparing error strings.
- No `panic()` in production paths; reserve these for truly unrecoverable startup failures only.
- Use structured logging.
- Pass `context.Context` as the first argument to all functions crossing runtime boundaries; avoid `context.Background()` outside `main` and focused tests.
- Design small, focused interfaces; accept interfaces, return structs.
- Use functional options pattern for complex constructors.
- Use compile-time interface verification: `var _ Interface = (*Type)(nil)`.
- Do not use `any` when a concrete type is known.
- Do not use reflection without performance justification.
- Keep comments short and focused on intent, invariants, or protocol edge cases.

## Testing

- Table-driven tests with subtests (`t.Run`) as the default pattern.
- Use `t.Parallel()` for independent subtests.
- Use `t.TempDir()` for filesystem isolation instead of manual temp directory management.
- Mark test helper functions with `t.Helper()` so stack traces point to the caller.
- Run tests with `-race` flag; the race detector must pass before committing.
- Mock dependencies via interfaces, not test-only methods in production code.
- Prefer root-cause fixes in failing tests over workarounds that mask the real issue.

## Architecture

### Concurrency discipline

- Every async operation must have explicit ownership and shutdown via `context.Context` cancellation.
- No untracked async operations; track all with proper lifecycle management.
- Use `select` with `ctx.Done()` in all long-running loops.
- Prefer channel-based communication over shared memory when practical.
- Use `RWMutex` for read-heavy shared state, `Mutex` for write-heavy.

### Runtime discipline

- Keep the system single-binary and local-first.
- Introduce sidecars or external control planes only with a written techspec.
- Keep execution paths deterministic and observable.

## Agent Skill Dispatch Protocol

Every agent MUST follow this protocol before writing code:

### Step 1: Identify Task Domain

Scan the task description and target files to determine which domains are involved:

- **Backend / Node.js** keywords: package, struct, interface, async, channel, context, logger, functional options, constructor, error handling
- **Config** keywords: config, TOML, environment, validation, settings
- **Logging** keywords: logger, logging, slog, log level, observer
- **Bug fix** keywords: bug, fix, error, failure, crash, unexpected, broken, regression
- **Writing tests** keywords: test, spec, mock, stub, fixture, assertion, coverage, table-driven
- **Task completion** keywords: done, complete, finished, ship
- **Architecture audit** keywords: architecture, dead code, code smell, anti-pattern, duplication
- **Creative / new features** keywords: new, feature, design, add, create, implement
- **Frontend / React** keywords: react, component, jsx, tsx, hook, props, state, render, virtual DOM
- **Frontend stack** keywords: shadcn, tailwind, tanstack, router, query, vitest, storybook, zod, zustand, vite, ai-sdk
- **TypeScript** keywords: typescript, type, generic, interface, utility type, tsx, ts
- **UI / UX design** keywords: design, layout, spacing, typography, color, visual, hierarchy, mockup, interface, minimalist, redesign, logo, brand

### Step 2: Activate All Matching Skills

Use the `Skill` tool to activate every skill that matches the identified domains:

| Domain                  | Required Skills                                                                 | Conditional Skills                                                                   |
| ----------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Backend / Node.js       | `typescript-advanced`                                                           | `clean-ddd-hexagonal`                                                               |
| Config                  | `typescript-advanced`                                                           |                                                                                      |
| Logging                 | `typescript-advanced`                                                           |                                                                                      |
| Bug fix                 | `systematic-debugging` + `no-workarounds`                                       | `testing-anti-patterns`                                                              |
| Writing tests           | `testing-anti-patterns` + `typescript-advanced`                                 |                                                                                      |
| Task completion         | `cy-final-verify`                                                               |                                                                                      |
| Frontend / React        | `typescript-advanced`                                                          | `vercel-react-best-practices`                                                       |
| shadcn / Tailwind UI    | `shadcn` + `shadcn-ui` + `tailwindcss`                                            |                                                                                      |
| TanStack stack          | `tanstack` + `tanstack-query-best-practices` + `tanstack-router-best-practices` | `tanstack-start-best-practices`                                                      |
| Frontend state         | `zustand`                                                                      |                                                                                      |
| UI / UX design          | `frontend-design` + `interface-design`                                         | `minimalist-ui`, `web-design-guidelines`                                            |

### Step 3: Verify Before Completion

Before any agent marks a task as complete:

1. Activate `cy-final-verify` skill
2. Run `npm run test`
3. Read and verify the full output — no skipping
4. Only then claim completion

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
11. **Fire-and-forget async operations** — every async operation must have explicit ownership and shutdown handling
12. **Use sleep in orchestration** — use proper synchronization primitives instead
13. **Ignore errors with `_`** — every error must be handled or have a written justification
14. **Hardcode configuration** — use TOML config or functional options
