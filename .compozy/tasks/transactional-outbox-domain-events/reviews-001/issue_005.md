---
status: resolved
file: src/modules/identity/infrastructure/relay/outbox_relay.ts
line: 153
severity: low
author: claude-code
provider_ref:
---

# Issue 005: No operational metrics or structured health logs

## Review Comment

The TechSpec at lines 221-243 defines a monitoring and observability section with structured logs for relay lifecycle events. The relay implements the defined log messages but the logs use raw `console.log` without structured fields compatible with the application's logging system (Fastify logger on line 50 of `src/main/index.ts`).

The `src/main/index.ts:50` creates a Fastify instance with `logger: true`, but the relay logs at lines 153-206 use `console.log` directly. This bypasses Fastify's structured logging and makes relay events harder to correlate in centralized logs.

## Triage

- Decision: `valid`
- Notes: The issue correctly identifies that `console.log` is used instead of structured logging. Fastify's built-in logger (`pino`) is the standard for this application and should be used for correlate-able logs. The relay is started in `src/main/index.ts` without access to Fastify's logger instance, so the fix is to inject a pino logger into the relay's constructor.