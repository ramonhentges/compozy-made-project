# Task Memory: task_04.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Add npm scripts to package.json for running migrations against Identity context database.

## Important Decisions

- Used dynamic config generation via node to pull connection string from identityDbConfig at runtime (rather than embedding in npm script)
- Scripts reference `src/config/databases/identity_context.ts` for configuration
- Migration folder is `src/migrations/identity_context`

## Learnings

The npm script uses nested command substitution: `$(node -r ts-node -r tsconfig-paths/register -e "...")` to get the DB config at runtime
node-pg-migrate accepts connection string via `-c` flag with `host=... port=...` format

## Files / Surfaces

- package.json - added 3 new scripts
- src/config/package-json-scripts.test.ts - created new test file

## Errors / Corrections

- Initial test used wrong path resolution; fixed by using process.cwd() instead of __dirname

## Ready for Next Run

Task complete. Scripts are functional and tested.