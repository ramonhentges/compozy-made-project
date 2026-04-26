---
status: resolved
file: frontend/src/router.tsx
line: 107
severity: medium
author: claude-code
provider_ref:
---

# Issue 001: Missing redirect parameter in auth guard

## Review Comment

The `beforeLoad` guard in `homeRoute` (lines 107-111) throws a redirect to `/login` when the user is not authenticated, but it does not preserve the originally requested URL. This means users who are redirected to login will lose their intended destination.

```typescript
beforeLoad: async () => {
  const authState = useAuthStore.getState();
  if (!authState.accessToken) {
    throw redirect({ to: '/login' });  // Missing redirect param
  }
},
```

**PRD Reference**: F4 specifies "Return URL param for post-login redirect". The techspec data flow shows `/login?redirect=/home` pattern.

**Current behavior**: User at `/home` → Not authenticated → Redirected to `/login` → After login → Goes to `/home` (hardcoded default)

**Expected behavior**: User at `/home` → Not authenticated → Redirected to `/login?redirect=/home` → After login → Returns to `/home`

**Suggested fix**: Pass the current path as a search parameter:

```typescript
beforeLoad: async ({ location }) => {
  const authState = useAuthStore.getState();
  if (!authState.accessToken) {
    throw redirect({ to: '/login', search: { redirect: location.pathname } });
  }
},
```

And update the login route schema in `router.tsx` to include a `redirect` search param:

```typescript
export const loginSearchSchema = z.object({
  message: z.string().optional(),
  redirect: z.string().optional(),
});
```

Then update `login.tsx` to use this redirect after successful login:

```typescript
const { redirect: returnPath } = useSearch({ from: '/login' });
// After login success:
navigate({ to: returnPath || '/home', replace: true });
```

## Triage

- Decision: `valid`
- Notes: Issue confirmed. The `beforeLoad` guard in `homeRoute` does not pass the current path as a redirect parameter, and the `loginSearchSchema` lacks a `redirect` field. Additionally, `login.tsx` hardcodes navigation to `/home` without checking for a redirect param. All three components need to be updated to implement the PRD F4 requirement.

- Root cause: Missing integration between the auth guard redirect and the login page's post-auth redirect handling.
- Fix approach:
  1. Add `redirect: z.string().optional()` to `loginSearchSchema`
  2. Update `beforeLoad` in `homeRoute` to pass `search: { redirect: location.pathname }`
  3. Update `login.tsx` to read `redirect` from search params and use it for post-login navigation