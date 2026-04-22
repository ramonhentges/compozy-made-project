# Task Memory: task_05.md

## Objective Snapshot

Implement infrastructure adapters for Identity module:
- UserRepository with pg-promise
- BcryptAdapter with 12 rounds
- JwtAdapter with HS256
- UserMapper for entity ↔ DTO mapping
- db_config for database configuration

## Important Decisions

- Used `../../domain/` for imports from infrastructure (2 levels up to identity/, then into domain/)
- Implemented pg-promise IDatabase<object> for repository
- Exported pgp (pgPromise instance) for potential schema initialization

## Learnings

- pg-promise uses snake_case column names (password_hash, created_at)
- JWT verify throws on invalid tokens, must catch and handle
- bcrypt rounds=12 as per ADR-007

## Files / Surfaces

**Created:**
- src/modules/identity/infrastructure/persistence/config/db_config.ts
- src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts
- src/modules/identity/infrastructure/persistence/repositories/user_repository.ts
- src/modules/identity/infrastructure/adapters/bcrypt_adapter.ts
- src/modules/identity/infrastructure/adapters/jwt_adapter.ts
- Test files for each adapter

## Errors / Corrections

- Fixed import paths: from `../../../domain/` to `../../domain/` for infrastructure adapters
- Fixed UserRepository.delete signature: parameter is `userId: UserId` not `user: User`

## Ready for Next Run

Task complete. Task 06 (HTTP Controllers) depends on these adapters.
