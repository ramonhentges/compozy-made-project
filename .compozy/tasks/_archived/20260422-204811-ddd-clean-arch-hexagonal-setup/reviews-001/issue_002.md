---
status: resolved
file: src/modules/identity/infrastructure/adapters/bcrypt_adapter.ts
line: 4
severity: critical
author: claude-code
provider_ref:
---

# Issue 002: Hardcoded BCRYPT_ROUNDS prevents runtime configuration

## Review Comment

The bcrypt cost factor is hardcoded to 12 at line 4. This prevents changing the security tradeoff between performance and hashing strength without code changes. Different environments may require different values (lower for tests, higher for production).

Suggested fix: Read from environment variable with a default:
```typescript
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
```

## Triage

- Decision: `valid`
- Notes: The hardcoded value is a legitimate configuration limitation. The suggested fix is idiomatic and correct. Applied as-is.
