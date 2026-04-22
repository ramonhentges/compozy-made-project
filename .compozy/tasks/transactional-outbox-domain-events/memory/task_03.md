# Task Memory: task_03.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
- Implement task 03: make Identity `UserRepository.save` and `update` persist aggregate rows and outbox rows in one pg-promise transaction, clearing aggregate events only after successful transaction work.

## Important Decisions
- Add a pure non-clearing aggregate event read method so infrastructure can map pending events before transaction success; continue using `pullDomainEvents()` only as the post-success clear operation.
- Wrap `delete(userId)` in a pg-promise transaction without adding delete events, preserving the existing port while matching V1's no-new-delete-event constraint.

## Learnings
- Current `UserRepository.save` and `update` call `db.none` directly, so the baseline has no transaction, outbox insert, or event clearing behavior.
- Repo root has `AGENTS.md`; `CLAUDE.md` was requested but is not present.
- No local Postgres endpoint or database URL is available in this environment; `user_repository.integration.test.ts` is present but skipped unless `IDENTITY_REPOSITORY_TEST_DATABASE_URL` is set.

## Files / Surfaces
- Touched: `src/shared/types/aggregate_root.ts`
- Touched: `src/shared/types/aggregate_root.test.ts`
- Touched: `src/modules/identity/infrastructure/persistence/repositories/user_repository.ts`
- Touched: `src/modules/identity/infrastructure/persistence/repositories/user_repository.test.ts`
- Added: `src/modules/identity/infrastructure/persistence/repositories/user_repository.integration.test.ts`

## Errors / Corrections
- Self-review correction: changed `delete(userId)` from direct `db.none` to `db.tx` after reconciling ADR-003 with the task's V1 delete semantics.

## Ready for Next Run
- Verification after code changes: `npm run build` passed; `npm test` passed with 174 passed and 2 skipped DB-gated tests; `npm run test:coverage` passed with 92.07% statement coverage.
