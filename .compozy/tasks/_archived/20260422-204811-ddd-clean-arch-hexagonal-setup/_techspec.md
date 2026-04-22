# TechSpec: DDD + Clean Architecture + Hexagonal Setup

## Executive Summary

Implement a modular monolith backend foundation combining Domain-Driven Design, Clean Architecture, and Hexagonal Architecture patterns. The Identity bounded context provides registration, login, and logout with full layer separation.

**Implementation Strategy:** Module-first structure (`src/modules/identity/`) with domain/application/infrastructure layers nested inside each module. Manual dependency injection via composition root. pg-promise for persistence.

**Primary Trade-off:** Using pg-promise over a full ORM keeps domain completely agnostic (zero imports from infrastructure) at the cost of manual SQL query management.

---

## System Architecture

### Directory Structure

```
src/
├── modules/
│   └── identity/                  # Identity bounded context
│       ├── domain/               # Pure business logic (ZERO external deps)
│       │   ├── entities/
│       │   │   └── user.ts      # User aggregate root
│       │   ├── value_objects/
│       │   │   ├── email.ts
│       │   │   ├── password.ts
│       │   │   └── user_id.ts
│       │   ├── repository/
│       │   │   └── user_repository.ts   # IUserRepository port (driven)
│       │   ├── services/
│       │   │   ├── password_hasher.ts
│       │   │   └── token_service.ts
│       │   ├── events/
│       │   │   └── user_registered.ts
│       │   └── errors/
│       │       ├── user_not_found_error.ts
│       │       └── invalid_credentials_error.ts
│       ├── application/            # Use cases (depends on domain only)
│       │   ├── register_user/
│       │   │   ├── command.ts
│       │   │   ├── handler.ts
│       │   │   └── port.ts
│       │   ├── login_user/
│       │   │   ├── command.ts
│       │   │   ├── handler.ts
│       │   │   └── port.ts
│       │   └── logout_user/
│       │       ├── handler.ts
│       │       └── port.ts
│       └── infrastructure/       # Adapters (implements ports)
│           ├── http/
│           │   ├── controllers/
│           │   │   ├── register_controller.ts
│           │   │   ├── login_controller.ts
│           │   │   └── logout_controller.ts
│           │   ├── routes.ts
│           │   └── middleware/
│           │       └── auth_middleware.ts
│           ├── persistence/
│           │   ├── repositories/
│           │   │   └── user_repository.ts
│           │   ├── mappers/
│           │   │   └── user_mapper.ts
│           │   └── config/
│           │       └── db_config.ts
│           └── adapters/
│               ├── bcrypt_adapter.ts
│               └── jwt_adapter.ts
├── shared/                      # Cross-module concerns
│   ├── errors/
│   │   ├── domain_error.ts
│   │   └── application_error.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
├── config/
│   └── index.ts                  # Environment configuration
└── main/
    └── index.ts                 # Entry point, DI composition root
```

### Layer Responsibilities

| Layer | Responsibility | Dependency Rule |
|-------|---------------|-----------------|
| **Domain** | Entities, value objects, repository interfaces, domain services | Zero external dependencies |
| **Application** | Use case handlers orchestrating domain logic | Depends only on domain |
| **Infrastructure** | HTTP controllers, DB repositories, external adapters | Implements domain ports |
| **Shared** | Common errors, types, utilities | No domain/application imports |

---

## Implementation Design

### Core Interfaces

```typescript
// src/modules/identity/domain/repository/user_repository.ts
export interface IUserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(userId: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(user: User): Promise<void>;
}

// src/modules/identity/domain/services/password_hasher.ts
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

// src/modules/identity/domain/services/token_service.ts
export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
}

// src/modules/identity/application/register_user/port.ts
export interface IRegisterUserUseCase {
  execute(command: RegisterUserCommand): Promise<RegisterUserResult>;
}

// src/modules/identity/application/login_user/port.ts
export interface ILoginUserUseCase {
  execute(command: LoginUserCommand): Promise<LoginUserResult>;
}

// src/modules/identity/application/logout_user/port.ts
export interface ILogoutUserUseCase {
  execute userId: UserId): Promise<void>;
}
```

### Data Models

**User Entity (Aggregate Root):**
```typescript
// src/modules/identity/domain/entities/user.ts
import { AggregateRoot } from '@/shared/types';

export class User extends AggregateRoot<UserId> {
  private constructor(
    id: UserId,
    private email: Email,
    private passwordHash: string,
    private readonly createdAt: Date,
  ) {
    super(id);
  }

  static create(id: UserId, email: Email, passwordHash: string): User {
    const user = new User(id, email, passwordHash, new Date());
    user.addDomainEvent(new UserRegisteredEvent(user.id, user.email));
    return user;
  }

  getEmail(): Email { return this.email; }
  getPasswordHash(): string { return this.passwordHash; }
  setPasswordHash(hash: string): void { this.passwordHash = hash; }
}
```

**Value Objects:**
```typescript
// src/modules/identity/domain/value_objects/email.ts
export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new InvalidEmailError(value);
    }
  }

  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get value(): string { return this.value; }
}

// src/modules/identity/domain/value_objects/user_id.ts
export class UserId {
  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new InvalidUserIdError(value);
    }
    this.value = value;
  }

  private isValid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  value: string;
}
```

**Command/Result DTOs:**
```typescript
// src/modules/identity/application/register_user/command.ts
export interface RegisterUserCommand {
  email: string;
  password: string;
}

export interface RegisterUserResult {
  userId: string;
  email: string;
}

// src/modules/identity/application/login_user/command.ts
export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface LoginUserResult {
  accessToken: string;
  refreshToken: string;
}
```

### API Endpoints

| Endpoint | Method | Request Body | Response | Status |
|----------|--------|-------------|----------|--------|
| `/identity/register` | POST | `{email, password}` | `{userId, email}` | 201 Created |
| `/identity/login` | POST | `{email, password}` | `{accessToken, refreshToken}` | 200 OK |
| `/identity/logout` | POST | `{}` (Authorization header) | `{}` | 200 OK |

---

## Integration Points

- **PostgreSQL**: Via pg-promise, connection pool in `infrastructure/persistence/config/db_config.ts`
- **JWT**: HS256 algorithm, secret from `JWT_SECRET` env, 15min access / 7d refresh expiry
- **bcrypt**: Password hashing with 12 rounds

---

## Impact Analysis

| Component | Impact | Description | Action |
|-----------|--------|-------------|--------|
| `src/modules/identity/` | new | Complete Identity module | Implement all layers in build order |
| `src/shared/` | new | Shared error types | Create minimal set |
| `src/main/` | new | Composition root | Wire dependencies |
| `package.json` | modified | Add dependencies | Install fastify, pg-promise, bcrypt, jsonwebtoken |
| `tsconfig.json` | modified | Path aliases | Configure `@modules/*` |

---

## Testing Approach

### Unit Tests

- **Domain**: User entity creation, Email/Password validation
- **Application**: RegisterUserHandler, LoginUserHandler with mock ports

```
src/modules/identity/
  domain/
    entities/
      user.test.ts
  application/
    register_user/
      handler.test.ts
    login_user/
      handler.test.ts
```

### Integration Tests

- HTTP flow: register → login → logout
- Test client or test server

---

## Development Sequencing

### Build Order

1. **Shared types and errors** — No dependencies
2. **Identity domain layer** — Entities, value objects, ports
3. **Identity application layer** — Use case handlers
4. **Identity infrastructure adapters** — Repository impl, bcrypt, JWT
5. **Identity HTTP controllers** — Fastify routes + controllers
6. **Composition root** — Wire all dependencies in `main/index.ts`
7. **Integration tests** — Full HTTP flow tests

---

## Architecture Decision Records

- [ADR-001: Self-contained module structure](adrs/adr-001.md) — Each module has its own domain/app/infra/api
- [ADR-002: Domain layer isolation](adrs/adr-002.md) — Zero external imports in domain layer
- [ADR-003: Ports & Adapters inside module](adrs/adr-003.md) — Driven/driver ports in domain, adapters in infrastructure
- [ADR-004: Manual Dependency Injection](adrs/adr-004.md) — Plain DI via function parameters
- [ADR-005: JWT Token Session Management](adrs/adr-005.md) — JWT for stateless sessions
- [ADR-006: pg-promise for persistence](adrs/adr-006.md) — Lightweight SQL, domain agnostic
- [ADR-007: Domain Password Hashing](adrs/adr-007.md) — IPasswordHasher port with infrastructure adapter