---
status: resolved
file: src/modules/identity/domain/entities/user.ts
line: 44
severity: high
author: claude-code
provider_ref:
---

# Issue 006: changePassword fires UserRegisteredEvent instead of PasswordChangedEvent

## Review Comment

The `changePassword()` method at line 44 fires a `UserRegisteredEvent` when a password is changed. This is semantically incorrect and could cause issues in event-driven flows where downstream consumers expect distinct event types.

Suggested fix: Fire an appropriate `PasswordChangedEvent`:
```typescript
this.addDomainEvent(new PasswordChangedEvent(this.id, this._email));
```

## Triage

- Decision: `valid`
- Notes: The issue is valid. Line 44 fires `UserRegisteredEvent` when the password is changed, which is semantically incorrect. This is a copy-paste bug. Need to create a new `PasswordChangedEvent` class and update the import and usage in `changePassword()`.

