---
status: resolved
file: src/modules/identity/infrastructure/persistence/repositories/user_repository.ts
line: 81
severity: high
author: claude-code
provider_ref:
---

# Issue 001: N+1 problem in insertOutboxEvents

## Review Comment

In `user_repository.ts:81-92`, the `insertOutboxEvents` method performs individual INSERT statements in a loop:

```ts
for (const event of domainEvents) {
  const outboxRecord = OutboxEventMapper.toInsertData(event);
  await transaction.none(
    INSERT_OUTBOX_EVENT_SQL,
    toOutboxInsertParams(outboxRecord)
  );
}
```

This is an N+1 problem - if multiple domain events are raised in a single operation, each event triggers a separate database round-trip. For better performance, batch insert all events in a single SQL statement using `INSERT INTO ... VALUES (...), (...), (...)`.

## Triage

- Decision: `valid`
- Notes: The issue correctly identifies an N+1 problem. When multiple domain events are raised in a single operation (e.g., user registration triggering both UserRegisteredEvent and WelcomeEmailRequestedEvent), each event triggers a separate database round-trip. Batch inserting all events in a single SQL statement using `INSERT INTO ... VALUES (...), (...), (...)` will eliminate this performance issue.
