# TechSpec: Database Migrations Structure for Bounded Contexts

## Executive Summary

Implement a separated database migrations structure where each bounded context has its own dedicated database instance and its own migration folder under `src/migrations/<context_name>_context/` using snake_case naming convention. This approach provides maximum team autonomy by eliminating shared database schemas entirely, removing all potential for migration conflicts between teams.

**Implementation Strategy:** Using node-pg-migrate as the migration tooling framework with context-specific npm scripts (e.g., `npm run migrate:identity_context`) for executing migrations against each context's dedicated database. Cross-context data access will be handled through service APIs rather than direct database sharing.

**Primary Trade-off:** Using separate databases per bounded context provides complete isolation and eliminates migration conflicts at the cost of increased infrastructure complexity (more databases to manage) and the need for API-based cross-context data access.

## System Architecture

### Component Overview

- **Dedicated Databases**: Each bounded context has its own database instance (e.g., identity_db, billing_db, product_catalog_db)
- **Migration Folders**: Each bounded context has its own migration directory under `src/migrations/<context_name>_context/` containing migration files
- **Migration Configuration**: Each context uses environment variables or config files pointing to its dedicated database
- **Migration Commands**: Context-specific npm scripts in package.json for running migrations (e.g., `migrate:identity_context`, `migrate:identity_context:down`)
- **Cross-context Communication**: Service APIs for when one context needs data owned by another context
- **Event-Driven Updates**: Domain events for propagating changes that can tolerate eventual consistency

### Data Flow

1. Developers create migration files in their bounded context's migration folder
2. Migration files are executed via context-specific npm scripts targeting that context's database
3. Migration tool reads the context's database configuration (from env vars or config)
4. Migrations are applied to the context's dedicated database
5. For data needed from other contexts: 
   - Synchronous API calls for strongly consistent reads
   - Domain events for eventually consistent updates
6. Each context maintains exclusive ownership of its data schema

### Cross-Context Data Access Patterns

**Synchronous (Strong Consistency):**
- Context A makes HTTP request to Context B's API to fetch real-time data
- Used when current data is critical for the operation

**Asynchronous (Eventual Consistency):**
- Context B publishes domain events when its data changes
- Context A subscribes to relevant events and updates its own cache/view
- Used when slightly stale data is acceptable for better performance

## Implementation Design

### Core Interfaces

No specific core interfaces are defined for this infrastructure feature, as it primarily involves configuration and tooling setup rather than runtime interfaces.

### Data Models

**Migration Table Structure** (managed automatically by node-pg-migrate, one per database):
- Each migration creates a record in the migrations table within each context's database
- Table includes: id, timestamp, name (migration filename)
- Completely isolated per database/context

**Example Database per Context:**
- identity_db: Contains users, roles, permissions tables
- billing_db: Contains invoices, payments, subscriptions tables  
- product_catalog_db: Contains products, categories, inventory tables

### API Endpoints

No API endpoints are introduced by this infrastructure feature itself, but the pattern enables:
- Each bounded context to expose its own REST/gRPC/API endpoints for its data
- Context-to-context communication happens through these owned APIs

## Integration Points

- **Dedicated Database per Context**: PostgreSQL (or other) database instance exclusively for each bounded context
- **node-pg-migrate CLI**: Used for generating, running, and reverting migrations against each context's database
- **npm Scripts**: Custom scripts wrap node-pg-migrate commands with context-specific configurations
- **Inter-context APIs**: HTTP/gRPC APIs for bounded contexts to access each other's data when needed
- **Event Streaming** (optional): Message broker (e.g., RabbitMQ, Kafka) for distributing domain events

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `src/migrations/` | new | Directory structure for bounded context migrations | Create folder structure for each BC |
| `package.json` | modified | Add migration scripts for each context | Add context-specific migrate scripts |
| Database Infrastructure | modified | Need separate DB instances per BC | Provision/deploy multiple databases |
| Cross-context Data Access | modified | Shift from direct DB queries to API calls | Develop service APIs for data access |
| Developer Workflow | modified | New process for creating/executing migrations per context | Train teams on new workflow |
| CI/CD Pipelines | modified | Need to support context-specific migration execution against correct DB | Update pipelines to use context-specific scripts |
| Monitoring/Operations | modified | More databases to monitor, backup, maintain | Implement per-context DB observability |

## Testing Approach

### Unit Tests

Not applicable for this infrastructure feature as it primarily involves configuration and tooling.

### Integration Tests

- Verify that migrations can be executed successfully for each bounded context against its dedicated database
- Verify that running migrations for one context doesn't affect another context's database or migration history
- Verify that migration commands correctly target the intended context's migration folder and database
- Test rollback functionality for each context
- Verify cross-context data access patterns work correctly (API calls, event handling)

## Development Sequencing

### Build Order

1. **Database Provisioning** — Set up separate database instances for each bounded context (identity_db, billing_db, etc.)
2. **Migration Tooling Setup** — Install node-pg-migrate and create configuration templates
3. **Identity Context Migration Folder** — Create `src/migrations/identity_context/` with appropriate configuration
4. **Migration Scripts** — Add `migrate:identity_context` and related scripts to package.json
5. **Initial Migration** — Create initial migration for identity context to establish baseline in identity_db
6. **Additional Contexts** — Repeat steps 3-5 for other bounded contexts as needed
7. **Cross-context APIs** — Develop APIs in each context for exposing necessary data to other contexts
8. **Event Mechanisms** — Implement domain event publishing/subscribing for eventually consistent data
9. **Documentation Update** — Document database per context and cross-context data access patterns
10. **CI/CD Integration** — Update pipelines to use context-specific migration scripts targeting correct databases

### Technical Dependencies

- Node.js and npm must be available
- Separate database instances must be provisioned and accessible for each bounded context
- node-pg-migrate must be installed as a development dependency
- For cross-context API communication: HTTP client libraries, API gateway/service mesh (if used)
- For event-driven updates: Message broker infrastructure (if implementing eventual consistency patterns)

## Monitoring and Observability

- **Per-Context Database Metrics**: Connection pool usage, query performance, replication lag (if applicable) for each database
- **Migration Status**: Track success/failure of migration runs per context/database
- **Migration History**: Monitor the number of migrations applied per context/database
- **Cross-context API Metrics**: Latency, error rates, throughput for inter-context service calls
- **Event Processing**: Lag, throughput, failure rates for domain event processing (if implemented)
- **Key Metrics**: 
  - Migration execution time per context
  - Number of migration conflicts per month (should be zero)
  - Deployment frequency per bounded context
  - Cross-context API latency and error rates
  - Database resource utilization per context

## Technical Considerations

### Key Decisions

- **Decision**: Use separate database instances per bounded context with node-pg-migrate migrations
  - **Rationale**: Provides complete isolation, eliminates all migration conflicts, maximizes team autonomy
  - **Trade-offs**: Increased infrastructure overhead; requires API-based cross-context data access
  - **Alternatives Rejected**: 
    - Shared database with separate migration folders (still risk of schema conflicts, coupling)
    - Shared database with shared tables (high coupling, conflict potential)
    - No separation (maximum conflict risk)

- **Decision**: Use node-pg-migrate with separated folders per bounded context
  - **Rationale**: Specifically designed for PostgreSQL, lightweight, excellent CLI, perfect for multiple folders
  - **Trade-offs**: PostgreSQL-only (but we're using PostgreSQL); smaller community than TypeORM
  - **Alternatives Rejected**: 
    - TypeORM migrations (heavier weight, includes ORM overhead)
    - Sequelize CLI (more verbose, less ideal if not using Sequelize ORM)
    - Flyway (JVM dependency, less native Node.js/TS integration)
    - Prisma Migrate (requires ORM adoption throughout application)
    - Custom scripts (re-inventing the wheel)

- **Decision**: Snake_case naming for migration folders (e.g., identity_context)
  - **Rationale**: Matches Node.js/TypeScript conventions, avoids case sensitivity issues
  - **Trade-offs**: Slightly more verbose than plain names
  - **Alternatives Rejected**: 
    - kebab-case (less conventional for directories)
    - PascalCase/camelCase (unconventional for directory names)
    - No separation (doesn't scale for multi-word names)

- **Decision**: Service API approach for cross-context data access (with events for eventual consistency)
  - **Rationale**: Maintains bounded context encapsulation, clear ownership, loose coupling
  - **Trade-offs**: Higher latency than direct database access; requires API development and maintenance
  - **Alternatives Rejected**: 
    - Direct database access (violates encapsulation)
    - Database replication (complexity, inconsistency issues)
    - Shared database for common data (still creates coupling point)
    - No sharing mechanism (impractical for real systems)

- **Decision**: Context-specific npm scripts for migration execution
  - **Rationale**: Improves developer experience, reduces errors, enables automation
  - **Trade-offs**: Requires updating package.json when adding contexts
  - **Alternatives Rejected**: 
    - Developer navigation approach (error-prone)
    - Both approaches (unnecessary complexity)
    - Configuration/environment variables (less discoverable)
    - Single command with parameter (less intuitive than dedicated scripts)

### Known Risks

- **Risk**: Infrastructure complexity increases with more databases to manage
  - **Mitigation**: Use database-as-a-service, automation tools (Terraform, Ansible), standardized DB templates
  
- **Risk**: Cross-context data access latency impacting performance
  - **Mitigation**: Implement caching strategies, use asynchronous patterns where possible, optimize APIs
  
- **Risk**: Inconsistent migration configurations across contexts
  - **Mitigation**: Create shared configuration templates and validation in code review
  
- **Risk**: Learning curve for new migration workflow and cross-context data patterns
  - **Mitigation**: Provide comprehensive documentation, examples, and hands-on workshops
  
- **Risk**: Data consistency challenges with eventual consistency patterns
  - **Mitigation**: Clearly define which data needs strong consistency (use APIs) vs. eventual consistency (use events)
  
- **Risk**: Orphaned data or unclear ownership boundaries
  - **Mitigation**: Maintain clear documentation of which context owns which data entities; establish data governance practices

## Architecture Decision Records

- [ADR-001: Migrations Structure for Bounded Contexts](adrs/adr-001.md) — Defined the folder structure approach for separating migrations per bounded context
- [ADR-002: Migration Tooling Selection](adrs/adr-002.md) — Selected node-pg-migrate as the migration tooling framework
- [ADR-003: Shared Data Handling Approach for Separate Databases](adrs/adr-003.md) — Chose service API approach for cross-context data access with separate databases
- [ADR-004: Bounded Context Migration Folder Naming Convention](adrs/adr-004.md) — Established snake_case naming for migration folders
- [ADR-005: Migration Execution Approach](adrs/adr-005.md) — Decided to provide context-specific migration commands in package.json