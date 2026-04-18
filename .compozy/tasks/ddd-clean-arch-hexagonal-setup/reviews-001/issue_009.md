---
status: resolved
file: src/modules/identity/domain/value_objects/email.ts
line: 20
severity: medium
author: claude-code
provider_ref:
---

# Issue 009: Email validation regex too permissive

## Review Comment

The regex at line 20 (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) accepts invalid email formats:
- `test@.com` (empty domain label before dot)
- `test@domain.` (trailing dot in domain)
- No length limits on local or domain parts

Suggested fix: Use a more restrictive regex or the `validator` library:
```typescript
import validator from 'validator';

private static isValid(email: string): boolean {
  return validator.isEmail(email);
}
```

## Triage

- Decision: `valid`
- Notes: The current regex accepts invalid formats like `test@.com` and `test@domain.` because `[^\s@]+` matches empty strings when appearing before/after other characters. Fixed by using a stricter RFC 5322-compliant regex that prevents empty labels around dots and enforces character class/length constraints.
- Code Changes: Updated `email.ts` with stricter regex, added edge case tests in `email.test.ts`.
