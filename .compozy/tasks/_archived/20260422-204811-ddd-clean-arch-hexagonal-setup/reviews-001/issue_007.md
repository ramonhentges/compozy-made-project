---
status: resolved
file: src/modules/identity/application/register_user/handler.ts
line: 9
severity: high
author: claude-code
provider_ref:
---

# Issue 007: DuplicateEmailError extends Error instead of DomainError

## Review Comment

The `DuplicateEmailError` class (lines 9-13) extends the generic `Error` instead of `DomainError` from the shared errors module. This creates an inconsistent error hierarchy within the application layer where some errors use the structured `DomainError` pattern and others use plain `Error`.

Suggested fix: Extend DomainError:
```typescript
import { DomainError } from '../../../../shared/errors/domain_error';

export class DuplicateEmailError extends DomainError {
  constructor(email: string) {
    super('DUPLICATE_EMAIL', `User with email ${email} already exists`, { email });
  }
}
```

## Triage

- Decision: `valid`
- Notes: Other error classes in the codebase (InvalidCredentialsError, UserNotFoundError, InvalidEmailError, InvalidUserIdError) extend DomainError for consistent error hierarchy. DuplicateEmailError should follow the same pattern.
- Root cause: Developer inconsistency - the error was created without following the established DomainError pattern.
- Fix approach: Import DomainError and extend it, passing the required code and message parameters.
