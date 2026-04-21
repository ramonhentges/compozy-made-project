# Database Migrations Structure — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Set up migration tooling with node-pg-migrate | completed | medium | — |
| 02 | Create migration folder structure for Identity bounded context | pending | low | 01 |
| 03 | Configure Identity context database connection | pending | medium | 01 |
| 04 | Add migration scripts to package.json for Identity context | pending | low | 01, 03 |
| 05 | Create initial migration for Identity context schema | completed | medium | 02, 03, 04 |
| 06 | Test migration execution for Identity context | pending | medium | 05 |