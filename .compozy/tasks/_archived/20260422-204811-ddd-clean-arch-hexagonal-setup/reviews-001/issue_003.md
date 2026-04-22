---
status: resolved
file: src/modules/identity/infrastructure/adapters/jwt_adapter.ts
line: 20
severity: critical
author: claude-code
provider_ref:
---

# Issue 003: JWT algorithm not explicitly specified in jwt.sign()

## Review Comment

The `jwt.sign()` calls at lines 20 and 32 do not specify the algorithm explicitly. While `jsonwebtoken` defaults to HS256, this should be explicit for security clarity and to prevent algorithm confusion attacks.

The `jwt.verify()` method also doesn't specify which algorithms it accepts, allowing any algorithm including `none`.

Suggested fix:
```typescript
return jwt.sign({...}, this.secret, { 
  expiresIn: ACCESS_TOKEN_EXPIRY,
  algorithm: 'HS256' 
});
```

And for verify:
```typescript
const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as...
```

## Triage

- Decision: `valid`
- Notes: The issue is valid. Explicitly specifying JWT algorithms is a security best practice to prevent algorithm confusion attacks and the "none" algorithm attack in jwt.verify(). The jsonwebtoken library supports this but it's not enabled by default.
