# Transactional Outbox for Domain Events TechSpec

## Executive Summary

This implementation adds a transactional outbox for the Identity bounded context. Identity repository persistence methods will write aggregate changes and pending aggregate domain events in the same pg-promise transaction, then clear the aggregate's in-memory events only after the transaction work succeeds. A background in-process relay will publish due outbox records to Kafka with at-least-once delivery semantics.

The primary trade-off is putting transaction orchestration inside the infrastructure repository instead of adding a broader Unit of Work abstraction. This keeps V1 small and aligned with the current repository-driven codebase, but future cross-aggregate transactions may still need a dedicated unit-of-work port.

## System Architecture

### Component Overview

- Identity `User` aggregate: continues raising pure domain events through `AggregateRoot.addDomainEvent`.
- Identity repository port: keeps existing `save`, `update`, and `delete` persistence methods.
- pg-promise `UserRepository`: persists aggregate rows and outbox rows atomically for insert, update, and delete.
- Outbox table: stores durable event envelopes, payloads, retry state, and publication status.
- Outbox relay: polls due outbox records in-process, claims batches, publishes to Kafka, and updates status.
- Kafka publisher adapter: implements the event publisher port using Kafka.
- Application bootstrap: creates the repository, Kafka publisher, relay, and starts/stops the relay with the Fastify lifecycle.

Data flow:

1. The `User` aggregate raises `UserRegistered` or `PasswordChanged`.
2. The application handler calls the existing repository method.
3. The infrastructure repository opens a transaction, writes the aggregate, inserts outbox rows for pending events, then pulls saved events from the aggregate.
4. The relay polls `pending` records whose `next_attempt_at` is due.
5. The relay marks records `processing`, publishes them to Kafka, then marks them `published` or reschedules them.
6. Failed records reach terminal `failed` status after the configured maximum attempt count.

## Implementation Design

### Core Interfaces

The repository remains the primary application-facing persistence boundary. The outbox writer and publisher are infrastructure/application support contracts, not domain contracts.

```go
type OutboxEvent struct {
    ID          string
    EventName   string
    Version     int
    AggregateID string
    Payload     map[string]any
    OccurredOn  time.Time
}
```

```ts
export interface OutboxPublisher {
  publish(event: OutboxRecord): Promise<void>;
}

export interface OutboxRelay {
  start(): void;
  stop(): Promise<void>;
}

export interface OutboxRepository {
  claimDue(limit: number, now: Date): Promise<OutboxRecord[]>;
  markPublished(id: string, publishedAt: Date): Promise<void>;
  markRetry(id: string, attempts: number, nextAttemptAt: Date, error: string): Promise<void>;
  markFailed(id: string, attempts: number, error: string): Promise<void>;
}
```

Repository persistence behavior:

- `save(user)` inserts the user row and outbox rows in one transaction.
- `update(user)` updates the user row and outbox rows in one transaction.
- `delete(userId)` deletes the user row and persists any pending events already raised by the aggregate before deletion. V1 does not add new delete events.
- Domain events are pulled only after aggregate persistence and outbox insert work succeeds.

### Data Models

Outbox table: `events`

Fields:

- `id uuid primary key`
- `event_name varchar(255) not null`
- `event_version integer not null`
- `aggregate_type varchar(255) not null`
- `aggregate_id varchar(255) not null`
- `payload jsonb not null`
- `status varchar(32) not null`
- `attempts integer not null default 0`
- `next_attempt_at timestamp not null default now()`
- `last_error text null`
- `occurred_on timestamp not null`
- `created_at timestamp not null default now()`
- `processing_started_at timestamp null`
- `published_at timestamp null`

Statuses:

- `pending`: ready for first publish or scheduled retry.
- `processing`: claimed by a relay batch.
- `published`: Kafka publish succeeded.
- `failed`: maximum attempts reached.

Indexes:

- `(status, next_attempt_at)` for polling due records.
- `(aggregate_type, aggregate_id)` for investigation.
- `(event_name, event_version)` for event-type filtering.

Payload rules:

- Store existing domain event `data` as-is.
- `UserRegistered` persists `{ "email": "..." }`.
- `PasswordChanged` persists `null`.
- Do not store passwords, password hashes, tokens, or request metadata.
- Logs must include event IDs and status fields, not full payloads.

### API Endpoints

No public HTTP endpoints are added in V1.

Existing Identity endpoints continue using the current handlers and repository port:

- `POST /register`: persists `UserRegistered` outbox records through `UserRepository.save`.
- Future password-change use cases: persist `PasswordChanged` outbox records through `UserRepository.update`.

Operational visibility comes from database status fields and structured logs, not an admin API.

## Integration Points

### Kafka

Purpose: deliver Identity domain events to downstream consumers.

Configuration:

- `KAFKA_BROKERS`
- `KAFKA_CLIENT_ID`
- `IDENTITY_OUTBOX_TOPIC`
- `OUTBOX_RELAY_POLL_INTERVAL_MS`
- `OUTBOX_RELAY_BATCH_SIZE`
- `OUTBOX_RELAY_MAX_ATTEMPTS`
- `OUTBOX_RELAY_BACKOFF_BASE_MS`
- `OUTBOX_RELAY_BACKOFF_MAX_MS`

Topic contract:

- Key: `aggregateId`, so all events for the same aggregate are published to the same Kafka partition.
- Value: event envelope with `eventId`, `eventName`, `eventVersion`, `aggregateType`, `aggregateId`, `occurredOn`, and `data`.
- Delivery: at least once. Consumers must deduplicate by `eventId`.

Error handling:

- Kafka publish failures do not fail user-facing requests.
- Relay failures update retry metadata and log structured failure context.
- Terminal failures set `status = failed` with `last_error`.

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|----------------------|-----------------|
| `src/shared/types/aggregate_root.ts` | modified | Event pulling semantics become part of persistence reliability. Medium risk if events are cleared too early. | Test pull timing on repository success and failure. |
| `src/modules/identity/infrastructure/persistence/repositories/user_repository.ts` | modified | Repository methods add transaction and outbox insertion behavior. High risk because it touches persistence. | Add unit tests for aggregate write plus outbox insert. |
| `src/modules/identity/infrastructure/persistence/` | new | Add outbox SQL helpers, repository, relay storage operations, and mappers. Medium risk. | Keep infrastructure-only and avoid domain imports beyond `DomainEvent`. |
| `src/migrations/identity_context/` | modified | Add `events` outbox table migration and rollback. Medium risk. | Add migration structure tests and SQL review. |
| `src/config/` | modified | Add Kafka and relay configuration. Low risk. | Validate defaults and required env vars. |
| `src/main/index.ts` | modified | Start and stop relay with Fastify lifecycle. Medium risk. | Ensure graceful shutdown disconnects Kafka producer and stops polling. |
| `package.json` | modified | Add Kafka client dependency. Medium risk. | Use one concrete Kafka client package and test build. |

## Testing Approach

### Unit Tests

- `UserRepository.save` inserts user and outbox records in one transaction.
- `UserRepository.update` updates user and inserts outbox records in one transaction.
- Failed aggregate persistence does not clear aggregate domain events.
- Failed outbox insert does not clear aggregate domain events.
- Outbox row mapping preserves event name, version, aggregate ID, occurred date, and payload.
- Relay marks successful publishes as `published`.
- Relay applies exponential backoff after transient publish failures.
- Relay marks records `failed` after max attempts.
- Relay logs status changes without payload leakage.

Mocks:

- pg-promise database and transaction objects.
- Kafka publisher adapter.
- Clock/backoff calculation.

### Integration Tests

- Migration creates `events` with expected columns and indexes.
- Repository integration against test database commits user and outbox row atomically.
- Rollback path leaves neither aggregate change nor outbox row committed.
- Relay integration can claim due records without double-claiming a batch.

Environment dependencies:

- PostgreSQL test database for migration and repository integration tests.
- Kafka can be mocked at adapter boundary for V1 automated tests unless the project adds containerized broker tests.

## Development Sequencing

### Build Order

1. Add the outbox migration under `src/migrations/identity_context/` - no dependencies.
2. Add outbox record types and SQL mapping under Identity infrastructure - depends on step 1.
3. Update `UserRepository.save`, `update`, and `delete` to use pg-promise transactions and insert outbox rows - depends on step 2.
4. Add repository tests for atomic aggregate/outbox persistence and event-pull timing - depends on step 3.
5. Add Kafka and relay configuration in `src/config/` - depends on step 2.
6. Add the Kafka publisher adapter - depends on step 5.
7. Add outbox relay polling, claiming, retry, and status updates - depends on steps 2 and 6.
8. Wire the relay into `src/main/index.ts` startup and shutdown - depends on step 7.
9. Add relay unit tests for publish success, retry, terminal failure, and stop behavior - depends on step 7.
10. Run build, unit tests, and migration tests - depends on steps 1 through 9.

### Technical Dependencies

- Kafka broker endpoint and topic name for runtime configuration.
- A concrete Kafka client dependency, such as `kafkajs`.
- PostgreSQL support for transactional row claiming. Use row-level locking where available.
- Consumer agreement that delivery is at least once and deduplication uses event ID.

## Monitoring and Observability

Logs:

- `outbox.event.claimed`
- `outbox.event.published`
- `outbox.event.retry_scheduled`
- `outbox.event.failed`
- `outbox.relay.started`
- `outbox.relay.stopped`

Structured fields:

- `eventId`
- `eventName`
- `eventVersion`
- `aggregateType`
- `aggregateId`
- `status`
- `attempts`
- `nextAttemptAt`
- `errorCode` or redacted error message

V1 does not add dashboards or metrics. Phase 2 can add counters for pending, published, retry, and failed records.

## Technical Considerations

### Key Decisions

- Decision: persist aggregate changes and domain events together inside repository methods.
  Rationale: fits the current repository-based architecture with minimal new abstraction.
  Trade-off: repository implementations now own transaction orchestration.
  Alternatives rejected: application Unit of Work, outbox-specific repository methods, external handler wrapper.

- Decision: use Kafka for V1 delivery.
  Rationale: user selected a real broker integration and Kafka as the target.
  Trade-off: adds runtime dependency and producer lifecycle management.
  Alternatives rejected: no-op publisher, PostgreSQL `LISTEN/NOTIFY`, delayed broker integration.

- Decision: publish Kafka messages with `aggregateId` as the partition key.
  Rationale: events for the same aggregate should stay on the same Kafka partition.
  Trade-off: hot aggregates can concentrate traffic on one partition.
  Alternatives rejected: event ID keying, which improves spread but does not preserve per-aggregate ordering.

- Decision: run relay in-process.
  Rationale: smallest deployment change for V1.
  Trade-off: API process owns background work and must handle graceful shutdown carefully.
  Alternatives rejected: separate worker process, startup-only drain.

- Decision: use `pending`, `processing`, `published`, and `failed` statuses with retry metadata.
  Rationale: supports visibility, safe claiming, retries, and terminal failure state.
  Trade-off: more state transitions to test than a minimal pending/published model.

### Known Risks

- Duplicate delivery can occur after publish succeeds but status update fails. Consumers must deduplicate by event ID.
- Multiple API instances may claim records concurrently. Use transactional claiming and row-level locking.
- Kafka outages can grow pending records. Backoff and terminal failure status limit tight retry loops.
- Email is stored in `UserRegistered` payload. Limit persisted payloads to existing event data, avoid passwords/tokens, and redact payloads from logs.
- Password-change event coverage depends on a future application use case invoking `User.changePassword` and `UserRepository.update`.

## Architecture Decision Records

- [ADR-001: Minimal Transactional Outbox Scope](adrs/adr-001.md) — Defines V1 as minimal outbox machinery with explicit delivery, safety, and boundary semantics.
- [ADR-002: Lean Reliability MVP Product Approach](adrs/adr-002.md) — Selects the smallest reliability-focused MVP and defers richer visibility and adoption tooling.
- [ADR-003: Repository-Captured Outbox Persistence](adrs/adr-003.md) — Records aggregate persistence and outbox inserts in repository transactions.
- [ADR-004: Kafka Relay With In-Process Polling](adrs/adr-004.md) — Selects Kafka delivery through an in-process polling relay with retry state.
