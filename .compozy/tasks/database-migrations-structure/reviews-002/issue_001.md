---
status: resolved
file: src/modules/identity/domain/entities/user.ts
line: 22
severity: critical
author: claude-code
provider_ref:
---

# Issue 001: TypeScript build fails due to type errors

## Review Comment

The TypeScript build (`npm run build`) fails with 6 type errors:

1. `src/modules/identity/domain/entities/user.test.ts(54,31)`: Conversion of type 'DomainEvent<Record<string, unknown>>' to type 'UserRegisteredEvent' may be a mistake.
2. `src/modules/identity/domain/entities/user.ts(22,25)`: Argument of type 'UserRegisteredEvent' is not assignable to parameter of type 'DomainEvent<Record<string, unknown>>'.
3. `src/modules/identity/domain/entities/user.ts(45,25)`: Argument of type 'PasswordChangedEvent' is not assignable to parameter of type 'DomainEvent<Record<string, unknown>>'.
4. `src/modules/identity/domain/entities/user.ts(45,59)`: Expected 1 arguments, but got 2.
5. `src/shared/types/aggregate_root.test.ts(16,21)`: Duplicate identifier 'aggregateId'.
6. `src/shared/types/aggregate_root.test.ts(31,25)`: Argument of type 'TestAggregateCreated' is not assignable to parameter of type 'DomainEvent<Record<string, unknown>>'.

The core issue is in `src/shared/types/aggregate_root.ts` where `DomainEvent<T>` is defined with `Record<string, unknown>` as the data type constraint, but domain events like `UserRegisteredEvent` and `PasswordChangedEvent` use stricter types. The generic constraint should be `unknown` instead of `Record<string, unknown>` to allow proper type inheritance.

Additionally, `UserEntity.addDomainEvent` method takes 1 argument but is being called with 2 at line 45.

**Suggested Fix**: In `src/shared/types/aggregate_root.ts`, change the generic constraint from `Record<string, unknown>` to `unknown`:

```typescript
// Before
export type DomainEvent<T extends Record<string, unknown> = { ... }

// After  
export type DomainEvent<T extends unknown = unknown> = { ... }
```

And fix the `addDomainEvent` call in `user.ts` line 45 to pass only 1 argument.

## Triage

- Decision: `valid`
- Root Cause: The `DomainEvent<TData>` interface used `Record<string, unknown>` as the default type parameter, which is incompatible with strongly-typed domain events like `UserRegisteredData` and `PasswordChangedData`. Additionally, `addDomainEvent` was being called with 2 arguments when it accepts only 1.
- Fix Applied:
  1. Changed `DomainEvent<TData = Record<string, unknown>>` to `DomainEvent<TData = unknown>` in `src/shared/types/domain_event.ts`
  2. Fixed `addDomainEvent` call at `user.ts:45` to pass 1 argument
  3. Fixed duplicate identifier in test file `aggregate_root.test.ts` (which was causing remaining build errors)
- Verification:
  - `npm run build` passes with 0 errors
  - `npm test` passes with 165 tests

## Resolution

- All TypeScript build errors have been resolved
- Changed files:
  - `src/shared/types/domain_event.ts`: Fixed generic constraint from `Record<string, unknown>` to `unknown`
  - `src/modules/identity/domain/entities/user.ts`: Fixed `addDomainEvent` call (line 45)
  - `src/shared/types/aggregate_root.test.ts`: Fixed duplicate identifier bug in test class constructor