# PRD: DDD + Clean Architecture + Hexagonal Setup

## Overview

Establish a modular monolith backend foundation using Domain-Driven Design (DDD), Clean Architecture, and Hexagonal Architecture (Ports & Adapters) principles. The implementation centers on an **Identity** bounded context providing user registration, login, and logout capabilities.

This architectural foundation enables future bounded contexts to follow the same patterns with proper separation of concerns, testability, and evolutionary scalability.

**Target users:** Development teams building Node.js/TypeScript backends that need clear architectural boundaries from day one.

**Business value:** Reduces technical debt by 40-60% over 2 years (industry research). Provides 80% of microservices benefits with 20% of operational complexity.

## Goals

1. **Structural foundation** — Establish `src/modules/` organization with self-contained bounded contexts
2. **Identity module delivery** — Working registration, login, and logout with HTTP endpoints
3. **Domain isolation** — Business logic with zero framework dependencies in domain layer
4. **Testable architecture** — Full unit and integration test coverage demonstrating pattern
5. **Developer productivity** — New developers can add a new bounded context in under 2 hours

**Target timeline:** 1-2 weeks for MVP completion

## User Stories

### As a developer, I want...

- **Clear module boundaries** so I know where to place new code
  - Given I am adding a feature, when I look at the module structure, then I can immediately identify the correct layer (domain/application/infrastructure)

- **Isolated domain logic** so my business rules are portable
  - Given domain logic, when I write it, then it has zero imports from infrastructure or external frameworks

- **Working Identity module** so the foundation is usable
  - Given the system, when I make a POST /register request, then a user is created
  - Given the system, when I make a POST /login request with valid credentials, then I receive a session token
  - Given the system, when I make a POST /logout request, then my session is invalidated

- **Comprehensive tests** so I can refactor confidently
  - Given domain logic, when I run tests, then they execute without needing database or HTTP frameworks

## Core Features

| Priority | Feature | Description |
|----------|---------|-------------|
| Critical | Root project structure | `src/modules/` as primary organization, `src/shared/`, `src/config/` as supporting directories |
| Critical | Identity module scaffold | Full Clean Architecture layers: `domain/`, `application/`, `infrastructure/` inside module |
| Critical | Domain layer | Entities, value objects, repository interfaces (driven ports), domain services, domain events — pure business logic, zero framework dependencies |
| High | Application layer | Use cases orchestrating business workflows; depends only on domain layer |
| High | Infrastructure layer | HTTP adapter (driver), persistence adapter, external service adapters |
| High | Manual DI container | Wire dependencies without framework magic; explicit and traceable |
| High | Unit tests | Domain and application layer tests using mocks |
| High | Integration tests | Full flow tests with test database |
| Medium | Domain events | Publish/subscribe pattern for cross-module communication |
| Medium | Shared utilities | Cross-cutting concerns: errors, types, base classes |
| Medium | TypeScript path aliases | Clean imports via `@modules/identity/...` paths |

## User Experience

### Developer Onboarding Flow

1. **Clone repository** → Run `npm install` → See working Identity endpoints
2. **Read module structure** → Understand domain/application/infrastructure separation
3. **Write domain logic** → Create entity in `domain/`, test in isolation
4. **Add use case** → Create handler in `application/`, wire to domain
5. **Expose HTTP** → Add controller in `infrastructure/http/`, wire to use case
6. **Verify tests** → Run `npm test` → See green across unit and integration

### API Contracts (MVP)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/identity/register` | POST | Create new user account |
| `/identity/login` | POST | Authenticate and receive session |
| `/identity/logout` | POST | Invalidate session |

## High-Level Technical Constraints

- **Runtime:** Node.js with TypeScript (strict mode)
- **HTTP framework:** Fastify (lightweight, fast)
- **Database:** PostgreSQL (for integration tests, concrete choice deferred for MVP)
- **ORM:** Deferred — domain layer remains ORM-agnostic
- **Session management:** Token-based (JWT or session token), concrete choice deferred
- **Testing:** Vitest for unit tests, testcontainers for integration tests

## Non-Goals (Out of Scope)

- **Authentication implementation beyond structure** — Just the scaffold and basic flows, not hardened security
- **Database migrations/schema** — Will be implemented when domain needs persistence
- **Multi-module communication** — Single module focus for MVP; events structure in place
- **Microservices extraction** — Not needed at this scale
- **API versioning** — Implement when needed
- **Monitoring/observability** — Add when production-ready
- **Role-based access control** — Deferred to future modules

## Phased Rollout Plan

### MVP (Phase 1) — 1-2 weeks

**Deliverables:**
- Project structure with `modules/identity/`
- Domain layer: User entity, Email/Password value objects, IUserRepository port
- Application layer: RegisterUser, LoginUser, LogoutUser use cases
- Infrastructure layer: HTTP controllers, in-memory or mock persistence
- Unit tests for domain and application layers
- Integration tests for full HTTP flows

**Success criteria to proceed to Phase 2:**
- Domain layer has zero imports from outside domain (verified by lint/import rules)
- All use cases are framework-agnostic (tested with mocks only)
- Developer can trace a request from HTTP endpoint to domain logic
- Test coverage > 80% for domain and application layers

### Phase 2 — Future

**Potential features:**
- PostgreSQL persistence with real repository implementation
- Domain events for cross-module communication
- Second bounded context following the same patterns
- Production-ready auth hardening

### Phase 3 — Future

**Potential features:**
- Multiple modules with inter-module communication
- Event-driven architecture for async workflows
- Microservice extraction of selected module

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Domain layer isolation | 100% zero external imports | ESLint rules + automated import boundary tests |
| Test coverage (domain + application) | > 80% | CI test runner reports |
| Test isolation | 0 framework deps in unit tests | Unit test imports audit |
| Developer onboarding | New context in < 2 hours | Template + copy time measurement |
| Architecture enforcement | 0 domain layer violations | Automated boundary tests |

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Over-engineering for team size | Medium | Medium | Keep structure lightweight; defer advanced patterns to Phase 2 |
| Learning curve slowing initial velocity | Medium | High | Clear inline documentation per layer; working example in Identity module |
| Framework decisions blocking progress | Low | Medium | Defer ORM and session choices; use in-memory for MVP |
| Testing infrastructure complexity | Low | Medium | Use established tools (Vitest); testcontainers for DB integration |

## Architecture Decision Records

- [ADR-001: Self-contained module structure](adrs/adr-001.md) — Each module has its own domain/application/infrastructure
- [ADR-002: Domain layer isolation](adrs/adr-002.md) — Zero external imports in domain layer
- [ADR-003: Ports & Adapters inside module](adrs/adr-003.md) — Driven ports in domain, driver ports in application, adapters in infrastructure

## Open Questions

- **DI container choice:** Plain manual DI (simpler) vs. inversify/tsyringe (more structure) — Manual DI for MVP
- **ORM choice:** TypeORM, Prisma, or Drizzle — Deferred; domain remains ORM-agnostic
- **Session token format:** JWT vs. opaque session token — Deferred; interface in place
- **Database migration tooling:** Deferred until persistence is implemented
