---
status: resolved
file: src/main/index.ts
line: 24
severity: critical
author: claude-code
provider_ref:
---

# Issue 005: JWT secret not validated before use

## Review Comment

At line 24, the JWT adapter is initialized with `config.jwt.secret` without validation. If the secret is undefined, empty, or weak, JWT operations will fail with unclear errors or produce insecure tokens.

Suggested fix: Add validation in the composition root before creating the adapter:
```typescript
if (!config.jwt.secret || config.jwt.secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
const tokenService = new JwtAdapter({ secret: config.jwt.secret });
```

## Triage

- Decision: `valid`
- Notes: The issue correctly identifies that the JWT secret is used without validation. This is a security vulnerability - if the secret is undefined, empty, or too short, JWT operations will fail with unclear errors or produce insecure tokens.
