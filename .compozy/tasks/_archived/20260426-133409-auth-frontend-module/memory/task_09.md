# Task Memory: task_09.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Create login form page at /login route
- Implement React Hook Form with Zod validation
- Connect to loginFn server function
- Store token in Zustand on success
- Redirect to /home (or returnUrl) on success

## Important Decisions

- Used same patterns as register.tsx for consistency
- Used generic "Invalid email or password" message for all auth errors (security)
- ReturnUrl from location.state for post-login redirect
- Use navigate with replace after login to prevent back-button issues

## Learnings

- react-router v7 does not have `future` prop on BrowserRouter
- loginSchema requires password min(1) vs register password min(8) - different validation rules

## Files / Surfaces

- Created: frontend/src/routes/login.tsx
- Modified: frontend/src/router.tsx (import LoginPage, remove placeholder)
- Created: frontend/src/test/login.test.tsx

## Errors / Corrections

- Test assertion mismatch: Zod returns "Invalid email address" on empty email, fixed test to match actual message
- Type error: BrowserRouter future prop doesn't exist in react-router v7, removed from test utilities

## Ready for Next Run

- Task complete - all tests passing, build succeeds
- 88 tests passing
- Coverage on implemented code (login.routes) at 100%