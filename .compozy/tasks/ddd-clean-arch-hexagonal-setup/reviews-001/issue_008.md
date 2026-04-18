---
status: resolved
file: src/main/index.ts
line: 90
severity: high
author: claude-code
provider_ref:
---

# Issue 008: Error swallowing in main() prevents proper error handling

## Review Comment

Line 90 uses `main().catch(console.error)` which swallows errors without proper logging or graceful shutdown. Critical startup errors (database connection failure, port conflicts) will only print to console with no structured logging and no cleanup.

Suggested fix: Use proper error handling:
```typescript
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

Or better, use the structured logger from Fastify when available.

## Triage

- Decision: `valid`
- Root Cause: The `main().catch(console.error)` pattern only logs to console without exiting with a non-zero status code. This prevents proper error signaling and container orchestrators/kernels from detecting failures. Additionally, startup errors (DB connection, config validation) should trigger graceful shutdown including database cleanup.
- Fix Approach: Replace with proper error handling that uses structured logging, exits with code 1, and attempts graceful cleanup via `stopServer()` before exiting.
