# Identity Context Migrations

This directory contains database migrations for the Identity bounded context.

## Purpose

All database schema changes related to Identity (users, authentication, authorization, sessions) should be implemented as migrations in this folder.

## Naming Convention

Following ADR-004, migration folders use `snake_case` naming: `identity_context`.

## Migration Files

Migration files should follow node-pg-migrate naming conventions:
- `yyyyMMddHHmmss_<migration_name>.ts` or `.js`

## Usage

Run migrations:
```bash
node-pg-migrate up -d src/migrations/identity_context
```

Rollback migrations:
```bash
node-pg-migrate down -d src/migrations/identity_context
```

## Integration

This folder is referenced by migration configuration in `src/config/migration-config.ts`.