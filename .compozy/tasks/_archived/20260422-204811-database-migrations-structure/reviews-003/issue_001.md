---
status: resolved
file: src/config/migration-config.ts
line: 19
severity: medium
author: claude-code
provider_ref:
---

# Issue 001: Duplicate URL parsing logic in migration-config.ts

## Review Comment

The function `getMigrationEnvConfig` duplicates URL parsing logic that already exists in `src/config/utils/postgres-url.ts`. At line 19, it uses the same regex pattern:

```typescript
const match = dbUrl.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
```

This same regex is used in `parsePostgresUrl()` in the shared utility. This violates DRY and creates maintenance burden.

**Suggested Fix**: Refactor `getMigrationEnvConfig` and `createMigrationConfig` in `migration-config.ts` to use `parsePostgresUrl` from the shared utility:

```typescript
import { parsePostgresUrl } from './utils/postgres-url';

export function getMigrationEnvConfig(contextName: string): MigrationConfig {
  const dbUrl = process.env[`${contextName.toUpperCase()}_DATABASE_URL`];
  if (!dbUrl) {
    throw new Error(`Missing required environment variable: ${contextName.toUpperCase()}_DATABASE_URL`);
  }

  const parsed = parsePostgresUrl(dbUrl);
  return {
    database: {
      user: parsed.user,
      password: parsed.password,
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
    },
    migrationsDir: `src/migrations/${contextName}`,
  };
}
```

**Affected Files:**
- src/config/migration-config.ts (lines 19, 22, 57, 63)

## Triage

- Decision: `valid`
- Notes: Issue is valid. The function `getMigrationEnvConfig` (line 19 original) duplicated URL parsing logic from `parsePostgresUrl` in `src/config/utils/postgres-url.ts`. Both `getMigrationEnvConfig` and `createMigrationConfig` used the same regex pattern to parse PostgreSQL URL format. Fix: Imported `parsePostgresUrl` from `./utils/postgres-url` and refactored both functions to use the shared utility. Added try-catch in `getMigrationEnvConfig` to preserve the original error message format including the context name. All 165 tests pass after the fix.