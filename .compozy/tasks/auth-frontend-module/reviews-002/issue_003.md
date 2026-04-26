---
status: resolved
file: frontend/src/router.tsx
line: 1
severity: low
author: claude-code
provider_ref:
---

# Issue 003: Unused React Router import

## Review Comment

The `frontend/src/router.tsx` file imports from 'react-router' at line 1:

```typescript
import { createRouter, createRootRoute, createRoute, Outlet, Link, redirect, RouterProvider } from '@tanstack/react-router';
```

However, the `package.json` includes `react-router` as a dependency (version 7.1.0) which is likely unused since the project uses `@tanstack/react-router` throughout. The `react-router` package is the core React Router library, while `@tanstack/react-router` is TanStack's type-safe router built on top of React Router.

**Suggested fix**: If `react-router` is not needed (confirmed by grep showing no direct imports), remove it from package.json and any type imports. If it's needed for types or compatibility, add a comment explaining why.

## Triage

- Decision: `valid`
- Notes: Grep confirms all router imports use `@tanstack/react-router` - no direct imports from `react-router` anywhere in the frontend codebase. The `react-router` package in package.json appears to be an unused dependency. `@tanstack/react-router` includes react-router as a peer dependency, so the standalone `react-router` package is not needed.