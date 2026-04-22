---
status: resolved
file: src/modules/identity/domain/value_objects/password.ts
line: 6
severity: medium
author: claude-code
provider_ref:
---

# Issue 011: Password value object throws generic Error instead of DomainError

## Review Comment

The `Password.create()` method at line 6 throws a generic `Error` when the hash is empty. This is inconsistent with the `Email` value object which throws `InvalidEmailError` (a `DomainError`).

Suggested fix: Create and throw a `InvalidPasswordError` extending `DomainError`:
```typescript
export class InvalidPasswordError extends DomainError {
  constructor() {
    super('INVALID_PASSWORD', 'Password hash cannot be empty', {});
  }
}
```

## Triage

- Decision: `VALID`
- Notes: The issue is valid. Password value object throws generic Error (line 6) while Email throws domain-specific InvalidEmailError extending DomainError. This is inconsistent with the established pattern in the codebase. Fix applied: created InvalidPasswordError extending DomainError and exported it from the value object's index.ts.
