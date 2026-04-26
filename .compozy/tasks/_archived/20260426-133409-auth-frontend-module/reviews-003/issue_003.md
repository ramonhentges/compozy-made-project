---
status: resolved
file: backend/src/modules/identity/application/register_user/handler.ts
line: 37
severity: high
author: claude-code
provider_ref:
---

# Issue 003: Password validation logic in application layer

## Review Comment

The password validation logic at lines 37-54 in the register user handler is business logic that belongs in the domain layer. The validation checks:
- Minimum length of 8 characters
- Contains uppercase, lowercase, number, and special character

This validation is a domain rule (password strength requirements are business policy) and should be encapsulated in the `Password` value object in `domain/value_objects/password.ts`.

Current location violates Clean Architecture because business rules (password complexity) are in the application layer instead of the domain layer where they belong.

**TechSpec reference**: PRD line 25 specifies "Password strength requirements" as a registration feature, which is business logic.

**Suggested fix**: Move validation to `Password` value object:

```typescript
// domain/value_objects/password.ts
export class Password {
  // ... existing code
  
  static validateRaw(password: string): boolean {
    return password.length >= 8 && 
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  }
}
```

Then update the handler to use `Password.validateRaw()` or create a `Password.fromPlainText()` factory that validates.

## Triage

- Decision: `VALID`
- Notes: Issue confirmed - password validation is business logic that belongs in domain layer per Clean Architecture. Implemented fix by adding `Password.validateRaw()` static method to domain value object and removing application-layer validation. Tests added for new domain method. Handler now delegates to domain validation.

Fix applied:
1. Added `static validateRaw()` method to `domain/value_objects/password.ts`
2. Updated `handler.ts` to use `Password.validateRaw()` and removed private `isValidPassword()` method
3. Added 6 tests for validation rules in domain test file

Status: `RESOLVED`