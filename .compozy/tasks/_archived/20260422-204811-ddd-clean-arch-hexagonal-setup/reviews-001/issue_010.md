---
status: resolved
file: src/modules/identity/infrastructure/adapters/jwt_adapter.ts
line: 44
severity: medium
author: claude-code
provider_ref:
---

# Issue 010: Unsafe JWT payload casting in verify methods

## Review Comment

Lines 44 and 60 use unsafe type assertions to cast the JWT payload:
```typescript
const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload & {...}
```

If the token is malformed or the payload structure differs, this will fail at runtime when accessing properties like `decoded.userId` at lines 53 and 69.

Suggested fix: Validate the payload structure before accessing properties:
```typescript
const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
if (!decoded.userId || !decoded.email || !decoded.type) {
  throw new Error('Invalid token payload');
}
```

## Triage

- Decision: `valid`
- Root cause: Unsafe type assertions cast the JWT payload without validating that required fields exist. If a token is tampered with or malformed, accessing `decoded.userId`, `decoded.email` will fail at runtime or produce undefined values.
- Fix approach: Add runtime validation to check for required fields before accessing properties. Throw an error if any required field is missing.
