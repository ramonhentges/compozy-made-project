---
status: resolved
file: frontend/src/routes/register.tsx
line: 46
severity: high
author: claude-code
provider_ref:
---

# Issue 001: TanStack Router navigate state type incompatibility

## Review Comment

The `navigate` call at line 46 passes `state` with a `message` property:

```typescript
navigate({ to: '/login', state: { message: 'Registration successful! Please log in.' } });
```

However, TanStack Router's `navigate` function expects `state` to be of type `ParsedHistoryState | HistoryState`, and passing an arbitrary object with `message` causes a TypeScript error:

```
error TS2353: Object literal may only specify known properties, and 'message' does not exist in type 'NonNullableUpdater<ParsedHistoryState, HistoryState>'
```

This breaks the TypeScript build (`npm run build`). The type error indicates that TanStack Router's state typing is stricter than expected.

**Suggested fix**: Use TanStack Router's search params instead of state:

```typescript
navigate({ to: '/login', search: { message: 'Registration successful! Please log in.' } });
```

And update login.tsx to read from search params:

```typescript
const { message } = useSearchParams({ from: '/login' });
```

Alternatively, use a URL search parameter with the `hash` search parameter modifier.

## Triage

- Decision: `valid`
- Root cause: TanStack Router v1's `navigate` function expects `state` to be of type `ParsedHistoryState | HistoryState`. Passing an arbitrary object with `message` violates the type contract and causes TS2353.
- Fix approach:
  1. Add `validateSearch` schema to loginRoute in router.tsx to define the expected search params
  2. Change `navigate` call in register.tsx to use `search` instead of `state`
  3. Update login.tsx to use `useSearch({ from: '/login' })` instead of `useLocation()` to read the message