---
status: resolved
file: backend/src/modules/identity/application/register_user/handler.ts
line: 25
severity: high
author: claude-code
provider_ref:
---

# Issue 002: User name should be a value object with validation

## Review Comment

The register user handler accepts `name` as a string at line 25 without any validation or encapsulation. Unlike `Email` and `Password` which are properly implemented as value objects in the domain layer (`domain/value_objects/email.ts`, `domain/value_objects/password.ts`), the `name` field is treated as a primitive string.

This creates inconsistency:
- Email is a Value Object with format validation
- Password is a Value Object with complexity validation  
- Name is a raw string with no validation

According to DDD principles and the TechSpec (PRD line 51), name should be "2-100 chars". This validation business logic belongs in the domain layer, not in the application handler.

TechSpec reference: PRD line 51 specifies "name (required, 2-100 chars)" — business rules should be in domain.

**Suggested fix**: Create a Name value object in `domain/value_objects/name.ts`:

```typescript
// domain/value_objects/name.ts
import { DomainError } from '@/shared/errors/domain_error';

export class NameTooShortError extends DomainError {
  constructor() {
    super('Name must be at least 2 characters', 'NAME_TOO_SHORT');
  }
}

export class NameTooLongError extends DomainError {
  constructor() {
    super('Name must be at most 100 characters', 'NAME_TOO_LONG');
  }
}

export class Name {
  private constructor(readonly value: string) {}

  private static validate(value: string): void {
    if (!value || value.length < 2) {
      throw new NameTooShortError();
    }
    if (value.length > 100) {
      throw new NameTooLongError();
    }
  }

  static create(value: string): Name {
    Name.validate(value);
    return new Name(value);
  }

  equals(other: Name): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

Then update the handler to accept `Name` value object.

## Triage

- Decision: `valid`
- Root Cause: The handler accepts raw `string` for name without domain validation, inconsistent with Email and Password value objects.
- Fix Approach: Created Name value object with 2-100 chars validation in domain layer, updated handler and User entity to use it.

## Changes Made

1. Created `backend/src/modules/identity/domain/value_objects/name.ts` - Name value object with 2-100 chars validation
2. Updated `backend/src/modules/identity/domain/value_objects/index.ts` - exported Name and InvalidNameError
3. Updated `backend/src/modules/identity/domain/entities/user.ts` - uses Name instead of string
4. Updated `backend/src/modules/identity/application/register_user/handler.ts` - uses Name.create() and returns name.value
5. Updated `backend/src/modules/identity/application/register_user/handler.test.ts` - added validName to test inputs
6. Updated `backend/src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` - converts to/from Name value object
7. Updated multiple test files to use Name.create() instead of raw strings: login_user handler.test.ts, logout_user handler.test.ts, user.test.ts, user_mapper.test.ts, user_repository.test.ts, user_repository.integration.test.ts

## Verification
- TypeScript build: PASS
- Tests for changed files: 32 passed
- Pre-existing failures (9): unrelated to this fix