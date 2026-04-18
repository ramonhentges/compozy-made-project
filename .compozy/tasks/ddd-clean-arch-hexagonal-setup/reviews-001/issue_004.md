---
status: resolved
file: src/modules/identity/infrastructure/persistence/repositories/user_repository.ts
line: 19
severity: critical
author: claude-code
provider_ref:
---

# Issue 004: SQL injection via template literal in table name interpolation

## Review Comment

The table name `${this.tableName}` is interpolated directly into SQL queries at lines 19, 33, 45, 54, and 63. While `tableName` is currently private and set to a constant `'users'`, this pattern is dangerous and could lead to SQL injection if the table name source changes.

Although parameterized queries protect the column values, the table name itself is not parameterized.

Suggested fix: Either remove the variable and use a literal `'users'` in each query, or whitelist the table name:
```typescript
private readonly tableName = 'users'; // Keep as literal, not variable
```

If dynamic table names are truly needed, validate against an allowlist.

## Triage

- Decision: `valid`
- Notes: The issue is valid. The pattern of interpolating a variable into SQL is a security risk, even if currently set to a constant. The fix approach is to replace all template literals with the literal `'users'` string and remove the unused `tableName` property.

## Fix Applied

- Replaced all `${this.tableName}` interpolations with literal `'users'` strings
- Removed the unused `private readonly tableName = 'users';` property
- All queries now use hardcoded table name: lines 19, 32, 45, 54, 63
