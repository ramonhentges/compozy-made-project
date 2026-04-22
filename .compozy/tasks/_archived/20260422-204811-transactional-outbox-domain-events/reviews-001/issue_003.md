---
status: resolved
file: src/modules/identity/infrastructure/relay/outbox_relay.ts
line: 125
severity: medium
author: claude-code
provider_ref:
---

# Issue 003: Backoff calculation uses wall-clock time instead of record's nextAttemptAt

## Review Comment

In `outbox_relay.ts:125-129`, `calculateBackoff` uses `Date.now()` to compute the next retry timestamp:

```ts
private calculateBackoff(attempts: number): Date {
  const baseMs = this.config.backoffBaseMs;
  const maxMs = this.config.backoffMaxMs;
  const delayMs = Math.min(baseMs * Math.pow(2, attempts - 1), maxMs);
  return new Date(Date.now() + delayMs);
}
```

The TechSpec at lines 78-80 specifies backoff relative to the record's `nextAttemptAt` or current time. Using wall-clock time is acceptable but may cause jitter if the relay pauses and resumes. Consider anchoring the delay to the last `next_attempt_at` or recording the actual attempt time for visibility. This is a medium issue because the relay may schedule retries inconsistently if system clock jumps or the relay is paused.

## Triage

- Decision: `valid`
- Notes: The issue is valid. The original `calculateBackoff` function used `Date.now()` as the anchor for backoff calculation, which causes inconsistent retry scheduling when the relay is paused/resumed. The fix anchors the backoff to the record's existing `nextAttemptAt` when it's in the future, ensuring retries are scheduled relative to the original schedule rather than wall-clock time.

### Fix Applied
Modified `calculateBackoff` to accept `currentNextAttemptAt` as a parameter. If the record's `nextAttemptAt` is in the future, the delay is added to that time instead of `Date.now()`. This ensures retry consistency when the relay pauses and resumes.

Tests added: New test in `outbox_relay.test.ts` verifies that when `nextAttemptAt` is in the future, the next retry is scheduled relative to it.

---
status: resolved