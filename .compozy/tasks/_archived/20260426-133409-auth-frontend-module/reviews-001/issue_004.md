---
status: resolved
file: frontend/src/routes/login.tsx
line: 34
severity: medium
author: claude-code
provider_ref:
---

# Issue 004: Inconsistent redirect parameter naming

## Review Comment

Redirect parameters use inconsistent naming across pages:
- In login.tsx (line 34): `returnUrl` (named 'returnUrl')
- In home.tsx loader (line 20): `redirect` (named 'redirect')

Both serve the same purpose (where to redirect after auth), but use different names. This is a minor inconsistency but creates confusion.

Additionally, home.tsx (line 20) uses `?redirect=/home`, while login handles `returnUrl`.

**Suggested fix**: Standardize on `redirect`:
1. Update login.tsx to use `redirect` instead of `returnUrl`:
```typescript
const redirect = (location.state as { redirect?: string })?.redirect || '/home';
```

2. Update router.tsx to pass `redirect` consistently:
```typescript
throw redirect('/login?redirect=/home');
```

## Triage

- Decision: `invalid`
- Notes: After analyzing the codebase:
  1. login.tsx line 34 uses `location.state` only to read a `message` property (for success notifications after registration), NOT `returnUrl`
  2. home.tsx line 20 uses TanStack Router's built-in `redirect({ to: '/login' })` function, not a custom `redirect` parameter
  3. There is no actual inconsistency between `returnUrl` and `redirect` parameters - these are different concepts in the code
  4. The reviewer appears to have assumed usage patterns that don't exist in the codebase
  5. While there's a potential feature improvement (query param for post-login redirect), that's a separate enhancement, not a bug fix
