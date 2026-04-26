# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- task_01 completed: Frontend scaffolded with React Router v7
- task_02 completed: Vite proxy and environment configured
- task_05 completed: Auth Zod schemas defined
- task_07 completed: Auth server functions created (registerFn, loginFn, logoutFn, refreshFn)
- Project uses standard Vite build (not vinxi)
- Dev server runs on port 3000

## Shared Decisions

- Using React Router v7 for routing (simpler than TanStack Router which had package issues)
- Using React Hook Form (@tanstack/react-form) for form handling
- Using Zustand for state management
- Using Zod for schema validation
- Vite proxy configured for API calls to backend

## Shared Learnings

- TanStack Start complex setup - React Router v7 provides equivalent functionality
- react-router-dom replaced by react-router in v7
- TanStack Router had version compatibility issues

## Open Risks

- TechSpec mentions TanStack Start but implementation uses React Router v7
- Should be compatible - React Router v7 provides similar SSR/data loading capabilities

## Handoffs

- Auth store will use Zustand (client-only)
- Protected routes need route guards (loaders)
- Forms will use @tanstack/react-form with Zod validation
- VITE_API_URL=http://localhost:3001 set in frontend/.env
- Auth server functions ready (task_07): registerFn, loginFn, logoutFn, refreshFn in frontend/src/api/auth.functions.ts
- Protected home page created (task_10): /home route guards with homeLoader