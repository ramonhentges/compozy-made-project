import pgPromise, { IDatabase, IMain } from 'pg-promise';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RefreshToken } from '../../../domain/entities/refresh_token';
import { RefreshTokenId } from '../../../domain/value_objects/refresh_token_id';
import { UserId } from '../../../domain/value_objects/user_id';
import { RefreshTokenRepository } from './refresh_token_repository';

const testDatabaseUrl = process.env.IDENTITY_REPOSITORY_TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase('RefreshTokenRepository database transaction integration', () => {
  let pgp: IMain;
  let db: IDatabase<object>;
  let refreshTokenRepository: RefreshTokenRepository;

  beforeAll(() => {
    pgp = pgPromise({});
    db = pgp(testDatabaseUrl as string);
    refreshTokenRepository = new RefreshTokenRepository(db);
  });

  beforeEach(async () => {
    await db.none('DROP TABLE IF EXISTS events');
    await db.none('DROP TABLE IF EXISTS refresh_tokens');
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
    await db.none(`
      CREATE TABLE refresh_tokens (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMP NULL,
        device_info VARCHAR(255) NULL
      )
    `);
    await createEventsTable();
    await seedUser(db, '550e8400-e29b-41d4-a716-446655440000', 'test@example.com');
  });

  afterAll(() => {
    pgp.end();
  });

  it('commits refresh token and outbox row atomically', async () => {
    const refreshToken = createTestRefreshToken('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000');

    await refreshTokenRepository.save(refreshToken);

    const tokenRowCount = await db.one<{ count: string }>(
      'SELECT COUNT(*) AS count FROM refresh_tokens WHERE id = $1',
      [refreshToken.getId().value]
    );
    const eventRow = await db.one<{ event_name: string; aggregate_id: string }>(
      'SELECT event_name, aggregate_id FROM events WHERE aggregate_id = $1',
      [refreshToken.getId().value]
    );

    expect(Number(tokenRowCount.count)).toBe(1);
    expect(eventRow).toMatchObject({
      event_name: 'RefreshTokenCreated',
      aggregate_id: refreshToken.getId().value,
    });
  });

  it('rolls back the refresh token insert when outbox persistence fails', async () => {
    const refreshToken = createTestRefreshToken('670e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000');
    await db.none('DROP TABLE events');

    await expect(refreshTokenRepository.save(refreshToken)).rejects.toThrow();

    const tokenRowCount = await db.one<{ count: string }>(
      'SELECT COUNT(*) AS count FROM refresh_tokens WHERE id = $1',
      [refreshToken.getId().value]
    );

    expect(Number(tokenRowCount.count)).toBe(0);
    expect(refreshToken.pullDomainEvents()).toHaveLength(1);
  });

  it('finds refresh token by id', async () => {
    const refreshToken = createTestRefreshToken('680e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000');
    await refreshTokenRepository.save(refreshToken);

    const found = await refreshTokenRepository.findById(refreshToken.getId());

    expect(found).not.toBeNull();
    expect(found!.getId().value).toBe(refreshToken.getId().value);
    expect(found!.tokenHash).toBe(refreshToken.tokenHash);
  });

  it('finds refresh token by token hash', async () => {
    const refreshToken = createTestRefreshToken('690e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000');
    await refreshTokenRepository.save(refreshToken);

    const found = await refreshTokenRepository.findByTokenHash(refreshToken.tokenHash);

    expect(found).not.toBeNull();
    expect(found!.getId().value).toBe(refreshToken.getId().value);
  });

  it('finds active refresh token by user id', async () => {
    const refreshToken = createTestRefreshToken('6a0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000');
    await refreshTokenRepository.save(refreshToken);

    const found = await refreshTokenRepository.findActiveByUserId(refreshToken.userId);

    expect(found).not.toBeNull();
    expect(found!.getId().value).toBe(refreshToken.getId().value);
  });

  it('does not find expired refresh token as active', async () => {
    const refreshToken = createTestRefreshToken('6b0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', new Date(Date.now() - 1000));
    await refreshTokenRepository.save(refreshToken);

    const found = await refreshTokenRepository.findActiveByUserId(refreshToken.userId);

    expect(found).toBeNull();
  });

  it('does not find revoked refresh token as active', async () => {
    const refreshToken = createTestRefreshToken('6c0e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000');
    await refreshTokenRepository.save(refreshToken);
    refreshToken.revoke();
    await refreshTokenRepository.update(refreshToken);

    const found = await refreshTokenRepository.findActiveByUserId(refreshToken.userId);

    expect(found).toBeNull();
  });

  it('updates refresh token and persists outbox events', async () => {
    const refreshToken = createTestRefreshToken('6d0e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000');
    await refreshTokenRepository.save(refreshToken);
    refreshToken.revoke();

    await refreshTokenRepository.update(refreshToken);

    const found = await refreshTokenRepository.findById(refreshToken.getId());
    expect(found).not.toBeNull();
    expect(found!.isRevoked()).toBe(true);

    const eventRow = await db.one<{ event_name: string }>(
      'SELECT event_name FROM events WHERE aggregate_id = $1 AND event_name = $2',
      [refreshToken.getId().value, 'RefreshTokenRevoked']
    );
    expect(eventRow.event_name).toBe('RefreshTokenRevoked');
  });

  it('revokes all tokens for a user', async () => {
    const token1 = createTestRefreshToken('6e0e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000');
    const token2 = createTestRefreshToken('6f0e8400-e29b-41d4-a716-44665544000a', '550e8400-e29b-41d4-a716-446655440000');
    await refreshTokenRepository.save(token1);
    await refreshTokenRepository.save(token2);

    await refreshTokenRepository.revokeAllForUser(token1.userId);

    const found1 = await refreshTokenRepository.findById(token1.getId());
    const found2 = await refreshTokenRepository.findById(token2.getId());

    expect(found1!.isRevoked()).toBe(true);
    expect(found2!.isRevoked()).toBe(true);
  });

  it('counts active tokens for a user', async () => {
    const token1 = createTestRefreshToken('7e0e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000');
    const token2 = createTestRefreshToken('7f0e8400-e29b-41d4-a716-44665544000a', '550e8400-e29b-41d4-a716-446655440000');
    const expiredToken = createTestRefreshToken('80e8400-e29b-41d4-a716-44665544000b', '550e8400-e29b-41d4-a716-446655440000', new Date(Date.now() - 1000));
    await refreshTokenRepository.save(token1);
    await refreshTokenRepository.save(token2);
    await refreshTokenRepository.save(expiredToken);

    const count = await refreshTokenRepository.countActiveByUserId(token1.userId);

    expect(count).toBe(2);
  });

  it('revokes oldest tokens exceeding the limit', async () => {
    const token1 = createTestRefreshToken('81e8400-e29b-41d4-a716-44665544000c', '550e8400-e29b-41d4-a716-446655440000');
    const token2 = createTestRefreshToken('82e8400-e29b-41d4-a716-44665544000d', '550e8400-e29b-41d4-a716-446655440000');
    const token3 = createTestRefreshToken('83e8400-e29b-41d4-a716-44665544000e', '550e8400-e29b-41d4-a716-446655440000');
    await refreshTokenRepository.save(token1);
    await refreshTokenRepository.save(token2);
    await refreshTokenRepository.save(token3);

    await refreshTokenRepository.revokeOldestForUser(token1.userId, 2);

    const found1 = await refreshTokenRepository.findById(token1.getId());
    const found2 = await refreshTokenRepository.findById(token2.getId());
    const found3 = await refreshTokenRepository.findById(token3.getId());

    expect(found1!.isRevoked()).toBe(true);
    expect(found2!.isRevoked()).toBe(false);
    expect(found3!.isRevoked()).toBe(false);
  });

  it('deletes all tokens for a user', async () => {
    const token1 = createTestRefreshToken('7e0e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000');
    const token2 = createTestRefreshToken('7f0e8400-e29b-41d4-a716-44665544000a', '550e8400-e29b-41d4-a716-446655440000');
    await refreshTokenRepository.save(token1);
    await refreshTokenRepository.save(token2);

    await refreshTokenRepository.deleteAllByUserId(token1.userId);

    const found1 = await refreshTokenRepository.findById(token1.getId());
    const found2 = await refreshTokenRepository.findById(token2.getId());

    expect(found1).toBeNull();
    expect(found2).toBeNull();
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

  async function seedUser(database: IDatabase<object>, id: string, email: string): Promise<void> {
    await database.none(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [id, email, 'hashedPassword123']
    );
  }

  function createTestRefreshToken(id: string, userId: string, expiresAt?: Date): RefreshToken {
    return RefreshToken.create(
      RefreshTokenId.create(id),
      UserId.create(userId),
      'a'.repeat(64),
      expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      'Test Device'
    );
  }
});
