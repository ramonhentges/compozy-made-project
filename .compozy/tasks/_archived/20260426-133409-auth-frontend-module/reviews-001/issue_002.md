---
status: resolved
file: frontend/src/router.tsx
line: 1
severity: high
author: claude-code
provider_ref:
---

# Issue 002: Using react-router instead of TanStack Router

## Review Comment

The TechSpec (line 110-114) explicitly specifies TanStack Router for route structure:
- "TanStack Router loader-based auth validation" (F6)
- "Root loader for session restoration" (/root route)
- "beforeLoad checks auth store" for protected routes

However, the implementation uses react-router in `router.tsx` instead:
- `createBrowserRouter` from 'react-router' (line 1)
- Simple `loader` functions instead of TanStack's type-safe loaders
- Navigation via useNavigate instead of TanStack's typed navigation

This deviates from the explicit TechSpec design. TanStack Router provides:
- Type-safe route parameters
- Automatic serialization of loader data
- Better SSR integration
- Type-safe navigation

**Suggested fix**: Replace react-router with @tanstack/react-router:
- Import createRouter, Route from '@tanstack/react-router'
- Define route tree with proper types
- Update pages to use TanStack's hooks (useRouter, useLoaderData)

## Triage

- Decision: `VALID`
- Notes: The TechSpec explicitly specifies TanStack Router. The issue is valid.

## Resolution

**Fixed**: Migrated from react-router to @tanstack/react-router.

### Changes Made:

1. **Installed `@tanstack/react-router`** - Added as dependency

2. **Updated `frontend/src/router.tsx`:**
   - Replaced `createBrowserRouter` from 'react-router' with `createRouter` from '@tanstack/react-router'
   - Replaced array-based route config with hierarchical route tree using `createRootRoute`, `createRoute`
   - Added root loader for session restoration
   - Added `beforeLoad` guard for protected routes
   - Set up type-safe router with route tree

3. **Updated `frontend/src/main.tsx`:**
   - Changed import from `RouterProvider` from 'react-router' to '@tanstack/react-router'

4. **Updated route pages:**
   - `frontend/src/routes/home.tsx` - Updated imports, useLoaderData with type-safe `from` parameter
   - `frontend/src/routes/login.tsx` - Replaced useNavigate from TanStack Router
   - `frontend/src/routes/register.tsx` - Replaced useNavigate from TanStack Router

5. **Updated test setup:**
   - Added mock for `@tanstack/react-router` in test setup to properly mock Link and navigation hooks
   - Updated login and register tests to work with TanStack Router
   - Updated home-loader tests to use TanStack Router's redirect syntax

### Verification:

- TypeScript compilation: Passed (`npm run build`)
- All 110 tests pass (`npm run test`)

## Resolved