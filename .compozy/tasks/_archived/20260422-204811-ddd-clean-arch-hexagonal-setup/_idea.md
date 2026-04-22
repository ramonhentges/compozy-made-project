# DDD + Clean Architecture + Hexagonal Setup

## Overview

Establish a modular monolith backend structure using Domain-Driven Design (DDD), Clean Architecture, and Hexagonal Architecture (Ports & Adapters) principles. Each bounded context (module) is self-contained with its own domain, application, and infrastructure layers. HTTP adapters live inside `infrastructure/http/`, not as a separate layer.

The initial implementation focuses on the "Identity" bounded context as the foundation, enabling future domains to follow the same pattern with proper separation of concerns, testability, and evolutionary scalability.

This is an architectural foundation task — not a user-facing feature.

## Problem

New Node.js/TypeScript projects often lack clear architectural boundaries. Without intentional structure:

- Business logic becomes entangled with HTTP handlers and database access
- Domain models leak infrastructure concerns (e.g., ORM decorators in entities)
- Testing becomes difficult as components have implicit external dependencies
- Scaling to multiple bounded contexts introduces friction due to unclear ownership boundaries
- Team collaboration suffers when code organization doesn't reflect domain boundaries

Industry research shows that projects adopting Clean Architecture principles early see 40-60% reduction in technical debt over 2 years, while modular monoliths provide 80% of microservices benefits with 20% of the operational complexity.

## Core Features

| #   | Feature                                        | Priority  | Description                                                                                          |
| --- | ---------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| F1  | Root project structure                        | Critical  | `src/modules/` as primary org, `shared/`, `config/` supporting dirs                                 |
| F2  | Identity module scaffold                       | Critical  | Full Clean Architecture layers: `domain/`, `application/`, `infrastructure/` inside module            |
| F3  | Domain layer (entities, value objects, ports) | Critical  | Pure business logic, zero framework deps; repository interfaces (driven ports) inside module         |
| F4  | Application layer (use cases, handlers)       | High      | Orchestration layer implementing business workflows; depends only on domain layer                   |
| F5  | Infrastructure layer (adapters)               | High      | HTTP (driver), persistence, external adapters inside module                                           |
| F7  | Module-level config                       | Medium    | Env variables and constants per module                                                            |
| F8  | Shared utilities (errors, types)          | Medium    | Cross-cutting concerns used across all modules                                                      |
| F9  | Base test structure                        | Medium    | Test utilities and patterns for unit/integration testing                                           |
| F10 | TypeScript path aliases                    | Medium    | Clean imports via `@modules/identity/...` paths                                                      |

## Module Structure (per bounded context)

```
src/
├── modules/
│   └── identity/
│       ├── domain/                    # Pure business logic (NO external deps)
│       │   ├── entities/              # User aggregate, related entities
│       │   ├── value-objects/         # Email, Password, UserId
│       │   ├── repository/             # IUserRepository interface (DRIVEN PORT)
│       │   ├── services/              # Domain services (password hashing logic)
│       │   └── events/                # Domain events (UserRegistered)
│       ├── application/               # Use cases (depends on domain)
│       │   ├── use-cases/
│       │   │   ├── register-user/
│       │   │   │   ├── command.ts
│       │   │   │   ├── handler.ts
│       │   │   │   └── port.ts        # IRegisterUserUseCase (DRIVER PORT)
│       │   │   └── authenticate/
│       │   ├── dto/                   # Request/Response DTOs
│       │   └── ports/                 # External service ports
│       ├── infrastructure/            # Adapters (implements domain ports)
│       │   ├── http/                  # HTTP adapter (DRIVER) - controllers, routes, middleware
│       │   ├── persistence/           # Database adapter
│       │   │   ├── repositories/      # UserRepository impl
│       │   │   ├── mappers/           # Domain <-> DB mappers
│       │   │   └── index.ts
│       │   ├── messaging/             # Message broker adapter (RabbitMQ, Kafka)
│       │   ├── config/                # Module-specific configuration
│       │   └── index.ts
│       └── config/                    # Module config (env variables, constants)
├── shared/                            # Cross-module concerns
│   ├── errors/                        # DomainError, ApplicationError base
│   ├── types/                        # Shared types, base classes
│   └── utils/
└── main/                             # Entry point, DI composition
```

## KPIs

| KPI                              | Target        | How to Measure                                |
| -------------------------------- | ------------- | --------------------------------------------- |
| Domain layer has zero imports from outside domain | 100% | Automated import boundary tests |
| Each module exposes only intended public interfaces | 100% | Module boundary tests verify no internal leakage |
| Use cases are framework-agnostic | 100% | Use case tests use mocks, no HTTP framework in unit tests |
| Initial setup completes in < 1 day | < 8 hours   | Time from start to running sample endpoint |
| Developer can add new domain in < 2 hours | < 2 hours | Template/copy time for new bounded context |

## Feature Assessment

| Criteria            | Question                                            | Score   |
| ------------------- | --------------------------------------------------- | ------- |
| **Impact**          | How much more valuable does this make the product?  | Must Do |
| **Reach**           | What % of users would this affect?                  | Must Do |
| **Frequency**       | How often would users encounter this value?         | Must Do |
| **Differentiation** | Does this set us apart or just match competitors?   | Strong  |
| **Defensibility**   | Is this easy to copy or does it compound over time? | Strong  |
| **Feasibility**     | Can we actually build this?                         | Must Do |

**Leverage Type:** Strategic Bet — foundational investment enabling all future development

## Council Insights

> Council session skipped — this is an architectural foundation task with well-established patterns. Implementation choices will be documented as ADRs during execution.

**Key trade-offs:**
- NestJS DI vs plain DI (inversify/tsyringe) — **Decision:** Plain DI container for clarity
- ORM choice (TypeORM, Prisma, Drizzle) — **Decision:** Keep ORM-agnostic in domain, choose during implementation

**Risks identified:**
- Over-engineering for small team — **Mitigation:** Keep structure lightweight
- Learning curve — **Mitigation:** Clear inline documentation per layer

## Out of Scope (V1)

- **Authentication implementation** — Just the structure, no actual auth logic
- **Database migrations/schema** — Will be domain-specific when implemented
- **Multi-module communication** — Single module focus for V1
- **Microservices extraction** — Not needed at this scale
- **API versioning** — Implement when needed
- **Monitoring/observability** — Add when production-ready

## Architecture Decision Records

- [ADR-001: Self-contained module structure](adrs/adr-001.md) — Each module has its own domain/app/infra/api
- [ADR-002: Domain layer isolation](adrs/adr-002.md) — Zero external imports in domain layer
- [ADR-003: Ports & Adapters inside module](adrs/adr-003.md) — Driven/driver ports defined in domain, adapters in infrastructure

## Open Questions

- Preferred DI container (inversify, tsyringe, or custom)?
- ORM for persistence (TypeORM, Prisma, Drizzle)?
- Any existing conventions to preserve?

---

**Technology Stack:** Node.js, TypeScript (strict), Fastify, PostgreSQL
**Project Type:** Backend API (Modular Monolith)