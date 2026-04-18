---
status: resolved
file: src/modules/identity/infrastructure/adapters/jwt_adapter.ts
line: 50
severity: medium
author: claude-code
provider_ref:
---

# Issue 012: Generic Error thrown instead of typed errors in JWT adapter

## Review Comment

Lines 50 and 66 throw generic `Error` instances with string messages. These should be typed errors that can be caught and handled specifically by callers.

Suggested fix: Create specific error classes:
```typescript
export class InvalidTokenTypeError extends Error {
  constructor(expected: string) {
    super(`Invalid token type: expected ${expected}`);
    this.name = 'InvalidTokenTypeError';
  }
}
```

## Triage

- Decision: `valid`
- Notes: The issue is valid. The JWT adapter throws generic `Error` instances at lines 46, 49, 61, and 64 (the issue mentions lines 50 and 66, which correspond to the same errors). Creating specific error classes allows callers to catch and handle different error types specifically, improving error handling and debugging. The fix approach is to create two error classes: `InvalidTokenPayloadError` for missing required fields and `InvalidTokenTypeError` for incorrect token types.
