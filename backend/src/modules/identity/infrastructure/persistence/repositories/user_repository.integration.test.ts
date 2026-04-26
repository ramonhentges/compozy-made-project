import pgPromise, { IDatabase, IMain } from 'pg-promise';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { User } from '../../../domain/entities/user';
import { Email } from '../../../domain/value_objects/email';
import { Name } from '../../../domain/value_objects/name';
import { UserId } from '../../../domain/value_objects/user_id';
import { UserRepository } from './user_repository';

const testDatabaseUrl = process.env.IDENTITY_REPOSITORY_TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase('UserRepository database transaction integration', () => {
  let pgp: IMain;
  let db: IDatabase<object>;
  let userRepository: UserRepository;

  beforeAll(() => {
    pgp = pgPromise({});
    db = pgp(testDatabaseUrl as string);
    userRepository = new UserRepository(db);
  });

  beforeEach(async () => {
    await db.none('DROP TABLE IF EXISTS events');
    await db.none('DROP TABLE IF EXISTS users');
    await db.none(`
      CREATE TABLE users (
        id uuid PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await createEventsTable();
  });

  afterAll(() => {
    pgp.end();
  });

  it('commits user and outbox row atomically', async () => {
    const user = createTestUser('b1b2c3d4-e5f6-4789-abcd-ef0123456789', 'commit@example.com');

    await userRepository.save(user);

    const userRowCount = await db.one<{ count: string }>(
      'SELECT COUNT(*) AS count FROM users WHERE id = $1',
      [user.getId().value]
    );
    const eventRow = await db.one<{ event_name: string; aggregate_id: string; payload: { email: string } }>(
      'SELECT event_name, aggregate_id, payload FROM events WHERE aggregate_id = $1',
      [user.getId().value]
    );

    expect(Number(userRowCount.count)).toBe(1);
    expect(eventRow).toMatchObject({
      event_name: 'UserRegistered',
      aggregate_id: user.getId().value,
      payload: { email: 'commit@example.com' },
    });
  });

  it('rolls back the user insert when outbox persistence fails', async () => {
    const user = createTestUser('c1b2c3d4-e5f6-4789-abcd-ef0123456789', 'rollback@example.com');
    await db.none('DROP TABLE events');

    await expect(userRepository.save(user)).rejects.toThrow();

    const userRowCount = await db.one<{ count: string }>(
      'SELECT COUNT(*) AS count FROM users WHERE id = $1',
      [user.getId().value]
    );

    expect(Number(userRowCount.count)).toBe(0);
    expect(user.pullDomainEvents()).toHaveLength(1);
  });

  async function createEventsTable(): Promise<void> {
    await db.none(`
      CREATE TABLE events (
        id uuid PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        event_version INTEGER NOT NULL,
        aggregate_type VARCHAR(255) NOT NULL,
        aggregate_id VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(32) NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_error TEXT NULL,
        occurred_on TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        processing_started_at TIMESTAMP NULL,
        published_at TIMESTAMP NULL,
        CONSTRAINT events_status_check CHECK (status IN ('pending', 'processing', 'published', 'failed'))
      )
    `);
  }

  function createTestUser(id: string, emailAddress: string): User {
    return User.create(
      UserId.create(id),
      Email.create(emailAddress),
      Name.create('Test User'),
      'hashedPassword123'
    );
  }
});
