---
status: resolved
file: frontend/src/routes/home.tsx
line: 30
severity: medium
author: claude-code
provider_ref:
---

# Issue 002: Dead code - unused handleLogout function

## Review Comment

The `home.tsx` file contains a standalone `handleLogout` function at lines 30-39 that is never used. The component instead uses an inline `onLogout` callback defined with `useCallback` at line 46-54.

```typescript
// Line 30-39: Never called
async function handleLogout(): Promise<void> {
  try {
    await logoutFn();
  } catch {
    // Proceed with logout even if API call fails
  } finally {
    useAuthStore.getState().clearAuth();
    throw redirect({ to: '/login' });
  }
}
```

This is dead code that:
- Is never imported or called anywhere
- Has a different behavior than the actual logout (throws redirect vs navigate)
- Reduces code clarity by suggesting an alternative logout path

**Suggested fix**: Remove the `handleLogout` function entirely. The `onLogout` callback with `useCallback` is the correct implementation.

## Triage

- Decision: `valid`
- Notes: The function `handleLogout` (lines 30-39) is dead code that is never imported or used. The component uses the `onLogout` callback defined with `useCallback` instead. Removing this function improves code clarity.

## Resolution

- Fix applied: Removed the unused `handleLogout` function (lines 30-39) from `frontend/src/routes/home.tsx`.
- Status: `resolved`