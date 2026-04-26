---
status: resolved
file: frontend/src/api/auth.schemas.ts
line: 17
severity: high
author: claude-code
provider_ref:
---

# Issue 001: Duplicate User interface definition

## Review Comment

The `User` interface is defined in both `auth.schemas.ts` (line 17-21) and `auth.store.ts` (line 4-8). This creates duplication and the potential for the interfaces to drift over time. TechSpec section "Core Interfaces" shows the User should only be in `auth.store.ts`, but `auth.schemas.ts` duplicates it.

The `auth.functions.ts` imports User from auth.schemas (line 1), while `home.tsx` imports User from auth.store (line 3). This inconsistent import pattern creates maintenance burden.

**Suggested fix**: Remove User from auth.schemas.ts and import from auth.store.ts or create a shared types file:

```typescript
// frontend/src/api/types.ts
export type { User } from '@/stores/auth.store';
export type { AuthResponse } from './auth.schemas';
```

Then update imports across auth.functions.ts and other files.

## Triage

- Decision: `valid`
- Notes: The issue was confirmed. I removed the duplicate `User` interface from `auth.schemas.ts` and updated `auth.functions.ts` to import `User` from `@/stores/auth.store` instead.

## Resolution

- **Fixed**: Removed duplicate `User` interface definition from `frontend/src/api/auth.schemas.ts`
- **Updated**: Changed import in `frontend/src/api/auth.functions.ts` to import `User` from `@/stores/auth.store`
- **Verification**: All 112 tests pass (112 passed)
- **Status**: `resolved`