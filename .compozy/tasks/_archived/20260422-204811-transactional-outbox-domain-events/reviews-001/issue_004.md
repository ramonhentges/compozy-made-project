---
status: resolved
file: src/modules/identity/infrastructure/relay/outbox_relay.ts
line: 71
severity: low
author: claude-code
provider_ref:
---

# Issue 004: Unhandled polling errors do not update retry state

## Review Comment

In `outbox_relay.ts:70-72`, polling errors are caught and logged but do not update any record state:

```ts
} catch (error) {
  console.error('Outbox relay poll error', { error: String(error) });
}
```

If `claimDue` throws (e.g., database connection loss), the relay logs the error but does not record the failure anywhere. For visibility and observability, consider logging structured fields consistent with the TechSpec (eventId, errorCode). This is a low issue because the relay will retry on the next poll cycle and the error is visible in logs.

## Triage

- Decision: `valid`
- Notes: The issue is valid. The current poll error logging at line 71 uses `console.error('Outbox relay poll error', { error: String(error) })` which is inconsistent with the TechSpec's structured logging pattern. All other events in this file use the pattern `console.log('outbox.event.<type>', JSON.stringify({...}))`. Adding a structured poll error log with errorCode will improve observability and consistency.

## Resolution

**Status: Already Fixed**

The poll error handling at lines 70-76 already implements structured logging:
- Uses `categorizeError(error)` to categorize the error (CONNECTION_ERROR, TIMEOUT, PERMISSION_ERROR, etc.)
- Calls `logPollError({ errorCode, error: String(error).substring(0, 1000) })`
- The `logPollError` function (lines 233-241) outputs: `console.log('outbox.poll.error', JSON.stringify({ errorCode, error }))`

This is consistent with the TechSpec pattern and the logging format used elsewhere in the file. The implementation satisfies the review requirement.