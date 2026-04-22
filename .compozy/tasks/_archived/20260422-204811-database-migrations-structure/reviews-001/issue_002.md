---
status: resolved
file: src/config/databases/identity_context.ts
line: 10
severity: medium
author: claude-code
provider_ref:
---

# Issue 002: Duplicate URL parsing logic across config files

## Review Comment

The function `parsePostgresUrl` is duplicated in two files:
- `src/config/databases/identity_context.ts` (lines 10-28)
- `src/config/index.ts` (lines 31-48) as `parseDatabaseUrl`

Both do the same thing: parse a PostgreSQL connection URL into its component parts. This violates the DRY principle and creates maintenance burden - any change to URL parsing logic must be made in both places.

**Suggested Fix**: Extract the URL parser to a shared utility module (e.g., `src/config/utils/parse-postgres-url.ts`) and import it where needed. Keep `parsePostgresUrl` as the canonical implementation and remove duplication.

**Affected Files:**
- src/config/databases/identity_context.ts
- src/config/index.ts

## Triage

- Decision: `valid`
- Notes: The issue is valid. Both `parsePostgresUrl` in identity_context.ts and `parseDatabaseUrl` in index.ts use identical regex `/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/` and return identical data structure. This is duplicate code that violates DRY principle.
- Fix: Created shared utility `src/config/utils/postgres-url.ts` exporting `parsePostgresUrl` function and `ParsedPostgresUrl` interface. Updated `identity_context.ts` to import from shared utility. Updated `index.ts` to wrap shared utility for backward compatibility. Added tests in `postgres-url.test.ts`.
- Verification: All config tests pass (10 tests).