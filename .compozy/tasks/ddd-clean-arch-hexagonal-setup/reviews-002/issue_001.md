---
status: resolved
file: src/modules/identity/infrastructure/http/controllers/register_controller.ts
line: 23
severity: high
author: claude-code
provider_ref:
---

# Issue 001: Register controller does not handle InvalidPasswordError

## Review Comment

The register controller catches `DuplicateEmailError` at line 24 but does not handle `InvalidPasswordError`. When password validation fails (in handler.ts:60-62), the error propagates uncaught and returns a generic 500 error to the client instead of a meaningful 400 response.

Suggested fix: Add handling for InvalidPasswordError:
```typescript
if (error instanceof DuplicateEmailError) {
  return reply.status(409).send({ error: 'Email already exists' });
}
if (error instanceof InvalidPasswordError) {
  return reply.status(400).send({ error: 'Password does not meet complexity requirements' });
}
```

## Triage

- Decision: `valid`
- Root cause: The controller only handles `DuplicateEmailError` but not `InvalidPasswordError`, which is thrown in `handler.ts:61` when password validation fails. The error propagates uncaught and Fastify returns a generic 500 error.
- Fix approach: Import `InvalidPasswordError` from handler.ts, add error handling block to return 400 status, update schema to include 400 response, add test for the new behavior.