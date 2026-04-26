# Task Memory: task_07.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Completed: Create auth server functions (register, login, logout, refresh)
- All 68 tests pass
- Coverage: 87.5% for auth.functions.ts (exceeds 80% target)

## Important Decisions

- Used fetch-based API calls instead of TanStack Start createServerFn (project uses React Router v7, not TanStack Start)
- Created AuthError class for proper error handling with code and status properties
- callApi<T> helper handles JSON parsing and error extraction

## Learnings

- TechSpec specified TanStack Start but project uses React Router v7 - pragmatic adaptation using fetch
- AuthError class needs `export class` not just `export type` for instanceof checks in tests

## Files / Surfaces

- Created: frontend/src/api/auth.functions.ts (server functions)
- Created: frontend/src/test/auth.functions.test.ts (15 unit tests)
- Modified: auth.functions.ts fixed export (class not type)

## Errors / Corrections

- AuthError export was `export type { AuthError }` instead of `export class` - fixed
- AuthError instanceof check failed in test - fixed by exporting class

## Ready for Next Run

- Auth server functions ready for use in pages (task_08, task_09)
- Functions: registerFn, loginFn, logoutFn, refreshFn
- All tests pass, coverage ≥80%