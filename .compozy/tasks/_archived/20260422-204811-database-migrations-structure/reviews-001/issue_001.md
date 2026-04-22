---
status: resolved
file: package.json
line: 11
severity: high
author: claude-code
provider_ref:
---

# Issue 001: Password exposed in npm script command line arguments

## Review Comment

The `migrate:identity_context` script passes database credentials as command-line arguments to node-pg-migrate, which are visible to all system processes via `ps` command:

```
"migrate:identity_context": "node-pg-migrate -c \"$(node ...)\""
```

This exposes database passwords in plaintext to anyone with access to the system. This vulnerability could be exploited in development environments, CI/CD pipelines, or shared development machines.

**Suggested Fix**: Use environment variables instead of passing credentials via CLI. Configure node-pg-migrate to read from environment or use a `.pgpass` file. Example using environment:

```json
"migrate:identity_context": "node-pg-migrate -c \"host=${IDENTITY_DB_HOST} port=${IDENTITY_DB_PORT} database=${IDENTITY_DB_NAME} user=${IDENTITY_DB_USER} password=${IDENTITY_DB_PASSWORD}\" -d src/migrations/identity_context"
```

Note: The credentials should be sourced from environment variables rather than embedded in the script.

## Triage

- Decision: `valid`
- Notes: The issue correctly identifies that passing credentials via CLI arguments exposes passwords in plaintext through process listings. The fix implemented uses environment variables injected into the spawned node-pg-migrate process via Node.js, which are not visible in process listings. This is a proper security fix that maintains the existing config loading pattern while eliminating CLI argument exposure.