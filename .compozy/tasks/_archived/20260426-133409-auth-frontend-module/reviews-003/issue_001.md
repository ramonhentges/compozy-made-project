---
status: resolved
file: backend/src/modules/identity/application/register_user/handler.ts
line: 16
severity: critical
author: claude-code
provider_ref:
---

# Issue 001: Inconsistent error hierarchy - InvalidPasswordError extends Error

## Review Comment

The `InvalidPasswordError` at line 16 in the register user handler extends the native `Error` class instead of `DomainError`. This violates the architectural pattern established throughout the identity context where all domain errors extend `DomainError`.

Comparison with other errors in the codebase:
- `InvalidEmailError` (domain/value_objects/email.ts) → extends `DomainError` ✅
- `InvalidPasswordError` (application/register_user/handler.ts:16) → extends `Error` ❌
- `InvalidCredentialsError` (domain/errors/invalid_credentials_error.ts) → extends `DomainError` ✅
- `UserNotFoundError` (domain/errors/user_not_found_error.ts) → extends `DomainError` ✅

This inconsistency makes error handling unpredictable and breaks the unified error handling pattern across the domain and application layers.

**Suggested fix**: Either move `InvalidPasswordError` to the domain layer (`domain/errors/` or `domain/value_objects/password.ts`) extending `DomainError`, or create it in the application layer extending a proper application error base class.

## Triage

- Decision: `valid`
- Notes: The issue is valid. The handler's `InvalidPasswordError` at line 16 extends the native `Error` class instead of `DomainError`. This is inconsistent with the codebase pattern where `DuplicateEmailError` (in the same file at line 10), `InvalidEmailError`, and all other domain/application errors extend `DomainError`. The domain layer has a separate `InvalidPasswordError` in `password.ts` for validating empty password hashes (different business context), so we keep `handler.ts`'s error for password complexity validation.
- Root cause: Error class hierarchy inconsistency - missing extension of `DomainError`.
- Fix approach: Change `InvalidPasswordError` in handler.ts to extend `DomainError` instead of `Error`, similar to `DuplicateEmailError` at line 10 in the same file.

## Verification Notes

- Build failures in `handler.test.ts` are pre-existing (missing `name` property in test command objects) - unrelated to this fix
- Unit tests pass: `npm run test src/modules/identity/application/register_user/handler.test.ts` - all 8 tests pass
- The fix correctly changes `InvalidPasswordError` to extend `DomainError` with proper code and message