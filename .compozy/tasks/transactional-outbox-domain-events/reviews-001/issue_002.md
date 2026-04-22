---
status: resolved
file: src/modules/identity/infrastructure/persistence/repositories/outbox_repository.ts
line: 50
severity: high
author: claude-code
provider_ref:
---

# Issue 002: Missing WHERE clause in status update after claim

## Review Comment

In `outbox_repository.ts:50-55`, after `claimDue` fetches records with `FOR UPDATE SKIP LOCKED`, the subsequent `UPDATE events SET status = 'processing'` query is missing a `WHERE id IN ($1:csv)` clause:

```ts
await this.db.none(
  `UPDATE events
   SET status = 'processing', processing_started_at = $2
   WHERE id IN ($3:csv)`,
  [ids, processingStartedAt]
);
```

The `$3:csv` placeholder is unbound to the `ids` array. This update will either fail at runtime or, more dangerously, update ALL pending events to `processing` status if pg-promise tolerates the unbound parameter. Add `$1:csv` for `ids` and pass `[processingStartedAt, ids]` as parameters, or execute the status update inside the same transaction that claimed the records.

## Triage

- Decision: `valid`
- Root Cause: The SQL query used `$2` for `processing_started_at` and `$3:csv` for ids in the WHERE clause, but the parameters array only had 2 elements `[ids, processingStartedAt]`. This means `$2` was incorrectly bound to `ids` and `$3` was unbound, causing the query to either fail or incorrectly update wrong records.
- Fix Approach: Changed `$3:csv` to `$1:csv` in the WHERE clause so it correctly references the `ids` array from the first parameter position.