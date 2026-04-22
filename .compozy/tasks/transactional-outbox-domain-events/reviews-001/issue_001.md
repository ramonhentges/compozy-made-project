---
status: resolved
file: src/main/index.test.ts
line: 9
severity: high
author: claude-code
provider_ref:
---

# Issue 001: Mock missing `fromAppConfig` static factory method

## Review Comment

The test at `src/main/index.test.ts:9` mocks `KafkaOutboxPublisher` but does not include the `fromAppConfig` static factory method. When `startServer` calls `KafkaOutboxPublisher.fromAppConfig(config.kafka)` at line 27 of `src/main/index.ts`, the mock returns `undefined`, causing a runtime error: `TypeError: __vite_ssr_import_6__.KafkaOutboxPublisher.fromAppConfig is not a function`.

The existing mock on lines 10-15 only stubs instance methods. Add a `.fromAppConfig` property to the mock that returns an object with the expected instance methods (connect, disconnect, publish, isConnected).

## Triage

- Decision: `valid`
- Notes: The issue is valid. The mock at lines 10-15 only defined the constructor mock via `vi.fn().mockImplementation()`, but did not include a static `fromAppConfig` method. When `startServer` calls `KafkaOutboxPublisher.fromAppConfig(config.kafka)` at line 27 of `src/main/index.ts`, the original mock returns `undefined` for the static method, causing a runtime error. The fix adds `fromAppConfig` as a static method on the mock using `Object.assign` to attach both the constructor implementation and the static factory method.

## Resolution

Fixed by updating the mock in `src/main/index.test.ts` to include the `fromAppConfig` static factory method:

```typescript
KafkaOutboxPublisher: Object.assign(
  vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
  })),
  {
    fromAppConfig: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      publish: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
    }),
  }
),
```

## Verification

- Tests pass: `npm run test` - 230 passed, 2 skipped
- Build succeeds: `npm run build` - exit code 0
- The specific test `src/main/index.test.ts` now passes without the `TypeError: KafkaOutboxPublisher.fromAppConfig is not a function` error.