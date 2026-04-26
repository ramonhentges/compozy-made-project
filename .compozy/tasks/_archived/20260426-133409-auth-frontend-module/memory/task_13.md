# Task Memory: task_13.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

- Task 13: Add name field to user registration (COMPLETED)
- Added name field to backend User entity, command, handler, controller, mapper, and OpenAPI schema
- All related tests pass (18/18)

## Important Decisions

- Added name as simple string (no validation value object - task spec was minimal)
- Made name required in registration (matching frontend form)
- Returned name in user response

## Learnings

- User entity constructor signature changed - requires name parameter
- User.create() static factory requires name now
- All dependent tests needed updating for new constructor signatures
- Mapper needed name in DTO

## Files / Surfaces

Modified (backend):
- src/modules/identity/domain/entities/user.ts
- src/modules/identity/domain/entities/user.test.ts
- src/modules/identity/application/register_user/command.ts
- src/modules/identity/application/register_user/handler.ts
- src/modules/identity/infrastructure/http/controllers/register_controller.ts
- src/modules/identity/infrastructure/http/controllers/register_controller.test.ts
- src/modules/identity/infrastructure/persistence/mappers/user_mapper.ts
- src/modules/identity/infrastructure/persistence/mappers/user_mapper.test.ts

Tests updated:
- register_controller.test.ts: added name to all test cases
- user.test.ts: added name constant, updated all User.create calls
- user_mapper.test.ts: added name constant, updated toDomain/toDTO tests
- login_user/handler.test.ts: added name to User.create calls
- logout_user/handler.test.ts: added name to User.create calls
- user_repository.test.ts: added name to createTestUser, mock DB responses

## Errors / Corrections

None - all changes were direct implementation.

## Ready for Next Run

Task 13 complete. Registration now accepts name field.

Note: Pre-existing test failures in:
- config tests (migration script path expectations)
- kafka_outbox_publisher.test.ts (topic name format)
These are unrelated to task 13.