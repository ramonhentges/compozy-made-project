# TechSpec: Value Object Instantiation Pattern

## Executive Summary

This specification implements the value object and entity instantiation pattern defined in the PRD. The core change makes constructors public for value objects (UserId, Email, Password) and entities (User), enabling mappers to instantiate directly from database data without redundant validation. For ID-type value objects, a parameterless `create()` method auto-generates UUID v4 using Node.js built-in `crypto.randomUUID()` via a shared utility. The primary technical trade-off is allowing public constructors enables both validation-bypassed instantiation in persistence layer and validated instantiation in application layer — enforced through code convention and review.

## System Architecture

### Component Overview

| Component | Responsibility | Public API |
|-----------|----------------|------------|
| `src/shared/utils/uuid_generator.ts` | Generate UUID v4 strings | `generateUuid(): string` |
| `src/modules/identity/domain/value_objects/user_id.ts` | User ID value object | `UserId.create(value)`, `UserId.create()` |
| `src/modules/identity/domain/value_objects/email.ts` | Email value object | `Email.create(value)` |
| `src/modules/identity/domain/value_objects/password.ts` | Password value object | `Password.create(hash)` |
| `src/modules/identity/domain/entities/user.ts` | User aggregate root | `User.create()`, `new User()` |
| `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` | DTO to domain mapping | `UserMapper.toDomain(dto)`, `UserMapper.toDTO(user)` |

## Implementation Design

### Core Interfaces

#### UUID Generator

```typescript
// src/shared/utils/uuid_generator.ts
import { randomUUID } from 'crypto';

export function generateUuid(): string {
  return randomUUID();
}
```

#### UserId Value Object

```typescript
// src/modules/identity/domain/value_objects/user_id.ts
import { generateUuid } from '../../../../shared/utils/uuid_generator';

export class UserId {
  public constructor(private readonly _value: string) {}

  static create(value: string): UserId {
    if (!UserId.isValid(value)) {
      throw new InvalidUserIdError(value);
    }
    return new UserId(value);
  }

  static create(): UserId {
    return new UserId(generateUuid());
  }

  private static isValid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }
}
```

#### Email Value Object

```typescript
// src/modules/identity/domain/value_objects/email.ts
export class Email {
  public constructor(private readonly _value: string) {}

  static create(value: string): Email {
    if (!Email.isValid(value)) {
      throw new InvalidEmailError(value);
    }
    return new Email(value);
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])){1,}$/;
    return emailRegex.test(email);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
```

#### Password Value Object

```typescript
// src/modules/identity/domain/value_objects/password.ts
export class Password {
  public constructor(private readonly _hash: string) {}

  static create(hash: string): Password {
    if (!hash || hash.length === 0) {
      throw new InvalidPasswordError();
    }
    return new Password(hash);
  }

  get hash(): string {
    return this._hash;
  }

  equals(other: Password): boolean {
    return this._hash === other._hash;
  }
}
```

#### User Entity

```typescript
// src/modules/identity/domain/entities/user.ts
export class User extends AggregateRoot<UserId> {
  public constructor(
    id: UserId,
    private readonly _email: Email,
    private _password: Password,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {
    super(id);
  }

  static create(id: UserId, email: Email, passwordHash: string): User {
    const password = Password.create(passwordHash);
    const user = new User(id, email, password, new Date(), new Date());
    user.addDomainEvent(new UserRegisteredEvent(user.id, user._email));
    return user;
  }

  // ... existing getters and methods unchanged
}
```

#### UserMapper

```typescript
// src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts
export class UserMapper {
  static toDomain(dto: UserDTO): User {
    const userId = new UserId(dto.id);
    const email = new Email(dto.email);
    return new User(userId, email, new Password(dto.password_hash), dto.created_at, dto.updated_at);
  }

  static toDTO(user: User): UserDTO {
    return {
      id: user.getId().value,
      email: user.email.value,
      password_hash: user.password.hash,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }
}
```

### Data Models

No changes to database schemas or DTO structures. The UserDTO interface remains unchanged.

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `src/shared/utils/uuid_generator.ts` | new | Create shared UUID generation utility | Create with `generateUuid()` function |
| `src/modules/identity/domain/value_objects/user_id.ts` | modified | Make constructor public, add parameterless `create()` | Update visibility, add method |
| `src/modules/identity/domain/value_objects/email.ts` | modified | Make constructor public | Update visibility |
| `src/modules/identity/domain/value_objects/password.ts` | modified | Make constructor public | Update visibility |
| `src/modules/identity/domain/entities/user.ts` | modified | Make constructor public | Update visibility |
| `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` | modified | Use constructors instead of `create()` | Update instantiation calls |
| `src/modules/identity/domain/value_objects/*.test.ts` | modified | Tests may need updates for public constructors | Review and update if needed |

## Testing Approach

### Unit Tests

- Validate that `UserId.create()` generates valid UUID v4
- Validate that `UserId.create(value)` still validates and throws on invalid input
- Validate that `Email.create(value)` and `Password.create(hash)` still validate
- Validate that public constructors accept valid parameters
- Validate that existing `equals()` methods work with new instances

### Integration Tests

- Validate that `UserMapper.toDomain()` produces valid domain objects
- Validate round-trip: `toDomain(toDTO(user))` equals original
- Validate that existing repository operations still work

## Development Sequencing

### Build Order

1. Create `src/shared/utils/uuid_generator.ts` - no dependencies
2. Update `src/modules/identity/domain/value_objects/user_id.ts` - depends on step 1
3. Update `src/modules/identity/domain/value_objects/email.ts` - no dependencies
4. Update `src/modules/identity/domain/value_objects/password.ts` - no dependencies
5. Update `src/modules/identity/domain/entities/user.ts` - depends on steps 2, 3, 4
6. Update `src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts` - depends on steps 2, 3, 4, 5
7. Run tests to verify all changes - depends on all previous steps

### Technical Dependencies

- No new npm packages required (uses built-in crypto)
- No database migrations needed
- Tests must pass after each step

## Technical Considerations

### Key Decisions

- **Decision**: Use public constructors for value objects and entities
- **Rationale**: Enables mappers to instantiate without redundant validation
- **Trade-offs**: Requires discipline to use `create()` in application layer
- **Alternatives rejected**: Separate factory methods (adds complexity), keep private constructors ( PRD not satisfied)

- **Decision**: Use Node.js built-in crypto.randomUUID()
- **Rationale**: No additional dependencies, sufficient for UUID v4
- **Trade-offs**: None significant
- **Alternatives rejected**: npm uuid package (unnecessary dependency)

### Known Risks

- **Risk**: Developers bypassing validation in application layer
- **Likelihood**: Medium
- **Mitigation**: Code review, linting rules (future enhancement)
- **Areas requiring further research**: ESLint rule configuration for constructor usage

## Architecture Decision Records

- [ADR-001: Value Object Instantiation Pattern](adrs/adr-001.md) — Defines constructor visibility and create() method behavior
- [ADR-002: Entity Constructor Visibility](adrs/adr-002.md) — Decision to make User entity constructor public
- [ADR-003: Shared UUID Generation Utility](adrs/adr-003.md) — Shared utility using crypto.randomUUID()