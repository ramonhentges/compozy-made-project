---
status: resolved
file: backend/src/modules/identity/infrastructure/persistence/repositories/user_repository.ts
line: 1
severity: high
author: claude-code
provider_ref:
---

# Issue 004: SQL commands in user repository missing name column

## Review Comment

The SQL commands in the user repository do not include the `name` column. When a user is saved or loaded from the database, the name field is not included in the SQL queries.

The current SQL likely looks like:
```sql
INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)
SELECT id, email, password_hash FROM users WHERE id = ?
```

This must include the `name` column:
```sql
INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)
SELECT id, email, name, password_hash FROM users WHERE id = ?
```

This causes:
1. User names are lost when saving (not included in INSERT)
2. Cannot load user names when retrieving users
3. Breaks the Name value object workflow (issue 002)

**Suggested fix**: Update the SQL queries in user_repository.ts to include the name column.

## Triage

- Decision: `valid`
- Notes: The issue is valid. The UserDTO includes `name: string` field, but all SQL queries in the repository were missing it. Verified by examining UserMapper which maps `dto.name` to `user.name.value`, confirming the name field should be persisted.

**Fix Applied:**

1. `findByEmail`: Added `name` to SELECT query
2. `findById`: Added `name` to SELECT query  
3. `save`: Added `name` to INSERT and updated parameter count from 5 to 6
4. `update`: Added `name` to SET clause and updated parameters

All four repository methods now correctly include the `name` column. Tests pass.
