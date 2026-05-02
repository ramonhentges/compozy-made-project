import pgPromise, { IDatabase, IMain } from 'pg-promise';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { UserId } from '../domain/value_objects/user_id';
import { UserRepository } from '../infrastructure/persistence/repositories/user_repository';
import { RefreshTokenRepository } from '../infrastructure/persistence/repositories/refresh_token_repository';
import { BcryptAdapter } from '../infrastructure/adapters/bcrypt_adapter';
import { JwtAdapter } from '../infrastructure/adapters/jwt_adapter';
import { LoginUserHandler } from './login_user/handler';
import { RefreshTokenHandler } from './refresh_token/handler';
import { LogoutUserHandler } from './logout_user/handler';
import { ListSessionsHandler } from './list_sessions/handler';
import { RevokeSessionHandler } from './revoke_session/handler';
import { hashRefreshToken } from '../infrastructure/utils/hash_refresh_token';
import { User } from '../domain/entities/user';
import { Email } from '../domain/value_objects/email';
import { Name } from '../domain/value_objects/name';

const testDatabaseUrl = process.env.IDENTITY_REPOSITORY_TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase('Multi-Device Session Integration Tests (US-1, US-2, US-3)', () => {
  let pgp: IMain;
  let db: IDatabase<object>;
  let userRepository: UserRepository;
  let refreshTokenRepository: RefreshTokenRepository;
  let bcryptAdapter: BcryptAdapter;
  let jwtAdapter: JwtAdapter;
  let loginHandler: LoginUserHandler;
  let refreshHandler: RefreshTokenHandler;
  let logoutHandler: LogoutUserHandler;
  let listSessionsHandler: ListSessionsHandler;
  let revokeSessionHandler: RevokeSessionHandler;

  const testPassword = 'SecurePass123!';
  const jwtAccessSecret = 'test-access-secret-key-for-integration-tests-only-32';
  const jwtRefreshSecret = 'test-refresh-secret-key-for-integration-tests-only-32';
  const deviceA = 'Mozilla/5.0 (Device A)';
  const deviceB = 'Mozilla/5.0 (Device B)';

  beforeAll(() => {
    pgp = pgPromise({});
    db = pgp(testDatabaseUrl as string);
    userRepository = new UserRepository(db);
    refreshTokenRepository = new RefreshTokenRepository(db);
    bcryptAdapter = new BcryptAdapter();
    jwtAdapter = new JwtAdapter({ accessSecret: jwtAccessSecret, refreshSecret: jwtRefreshSecret });

    loginHandler = new LoginUserHandler({
      userRepository,
      refreshTokenRepository,
      passwordHasher: bcryptAdapter,
      tokenService: jwtAdapter,
      maxSessionsPerUser: 3,
    });

    refreshHandler = new RefreshTokenHandler({
      userRepository,
      refreshTokenRepository,
      tokenService: jwtAdapter,
    });

    logoutHandler = new LogoutUserHandler({
      userRepository,
      refreshTokenRepository,
    });

    listSessionsHandler = new ListSessionsHandler({
      userRepository,
      refreshTokenRepository,
    });

    revokeSessionHandler = new RevokeSessionHandler({
      userRepository,
      refreshTokenRepository,
    });
  });

  beforeEach(async () => {
    await db.none('DROP TABLE IF EXISTS events');
    await db.none('DROP TABLE IF EXISTS refresh_tokens');
    await db.none('DROP TABLE IF EXISTS users');
    await db.none(`
      CREATE TABLE users (
        id uuid PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
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
        device_info VARCHAR(255) NULL,
        last_used_at TIMESTAMP NULL
      )
    `);
    await createEventsTable();
  });

  afterAll(() => {
    pgp.end();
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

  async function seedUser(email: string, password: string): Promise<{ id: string; email: string }> {
    const hashedPassword = await bcryptAdapter.hash(password);
    const user = User.create(
      UserId.create(),
      Email.create(email),
      Name.create('Test User'),
      hashedPassword
    );
    await userRepository.save(user);
    return { id: user.getId().value, email: user.email.value };
  }

  async function getAllRefreshTokensForUser(userId: string): Promise<
    Array<{
      id: string;
      user_id: string;
      token_hash: string;
      revoked_at: string | null;
      device_info: string | null;
      last_used_at: string | null;
    }>
  > {
    return db.manyOrNone(
      'SELECT id, user_id, token_hash, revoked_at, device_info, last_used_at FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
  }

  describe('US-1: Login from multiple devices', () => {
    it('allows a user to log in from two devices and creates distinct refresh tokens', async () => {
      const user = await seedUser('multi@example.com', testPassword);

      const resultA = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const resultB = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      expect(resultA.accessToken).toBeDefined();
      expect(resultA.refreshToken).toBeDefined();
      expect(resultB.accessToken).toBeDefined();
      expect(resultB.refreshToken).toBeDefined();
      expect(resultA.refreshToken).not.toBe(resultB.refreshToken);
      expect(resultA.accessToken).not.toBe(resultB.accessToken);

      const tokens = await getAllRefreshTokensForUser(user.id);
      expect(tokens).toHaveLength(2);

      const tokenA = tokens.find((t) => t.device_info === deviceA);
      const tokenB = tokens.find((t) => t.device_info === deviceB);
      expect(tokenA).toBeDefined();
      expect(tokenB).toBeDefined();
      expect(tokenA!.token_hash).not.toBe(tokenB!.token_hash);
      expect(tokenA!.revoked_at).toBeNull();
      expect(tokenB!.revoked_at).toBeNull();

      const accessPayloadA = jwtAdapter.verifyAccessToken(resultA.accessToken);
      const accessPayloadB = jwtAdapter.verifyAccessToken(resultB.accessToken);
      expect(accessPayloadA.userId.value).toBe(user.id);
      expect(accessPayloadB.userId.value).toBe(user.id);
    });

    it('stores device info with each refresh token', async () => {
      const user = await seedUser('device-info@example.com', testPassword);

      await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      const tokens = await getAllRefreshTokensForUser(user.id);
      const deviceNames = tokens.map((t) => t.device_info);
      expect(deviceNames).toContain(deviceA);
      expect(deviceNames).toContain(deviceB);
    });

    it('revokes oldest session when maxSessionsPerUser is exceeded', async () => {
      const user = await seedUser('session-limit@example.com', testPassword);

      const login1 = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: 'Device-1',
      });

      const login2 = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: 'Device-2',
      });

      const login3 = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: 'Device-3',
      });

      let tokens = await getAllRefreshTokensForUser(user.id);
      expect(tokens).toHaveLength(3);
      expect(tokens.filter((t) => t.revoked_at === null)).toHaveLength(3);

      const login4 = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: 'Device-4',
      });

      tokens = await getAllRefreshTokensForUser(user.id);
      expect(tokens).toHaveLength(4);
      expect(tokens.filter((t) => t.revoked_at === null)).toHaveLength(3);

      await expect(
        refreshHandler.execute({
          refreshToken: login1.refreshToken,
          deviceInfo: 'Device-1',
        })
      ).rejects.toThrow();

      const refresh4 = await refreshHandler.execute({
        refreshToken: login4.refreshToken,
        deviceInfo: 'Device-4',
      });
      expect(refresh4.accessToken).toBeDefined();
    });
  });

  describe('US-2: Multi-device session management', () => {
    it('refreshing on device A does not invalidate device B session', async () => {
      const user = await seedUser('refresh-isolation@example.com', testPassword);

      const loginA = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const loginB = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      const refreshA = await refreshHandler.execute({
        refreshToken: loginA.refreshToken,
        deviceInfo: deviceA,
      });

      expect(refreshA.accessToken).toBeDefined();
      expect(refreshA.refreshToken).toBeDefined();

      const refreshB = await refreshHandler.execute({
        refreshToken: loginB.refreshToken,
        deviceInfo: deviceB,
      });

      expect(refreshB.accessToken).toBeDefined();
      expect(refreshB.refreshToken).toBeDefined();

      const tokens = await getAllRefreshTokensForUser(user.id);
      expect(tokens).toHaveLength(4);

      const revokedCount = tokens.filter((t) => t.revoked_at !== null).length;
      expect(revokedCount).toBe(2);

      const activeCount = tokens.filter((t) => t.revoked_at === null).length;
      expect(activeCount).toBe(2);
    });

    it('preserves device info during token rotation', async () => {
      const user = await seedUser('rotation-device@example.com', testPassword);

      const loginResult = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      await refreshHandler.execute({
        refreshToken: loginResult.refreshToken,
        deviceInfo: deviceA,
      });

      const tokens = await getAllRefreshTokensForUser(user.id);
      const activeToken = tokens.find((t) => t.revoked_at === null);
      expect(activeToken).toBeDefined();
      expect(activeToken!.device_info).toBe(deviceA);
    });

    it('per-session logout invalidates only the current session', async () => {
      const user = await seedUser('logout-one@example.com', testPassword);

      const loginA = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const loginB = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      await logoutHandler.execute({ userId: user.id, tokenHash: hashRefreshToken(loginA.refreshToken) });

      const tokens = await getAllRefreshTokensForUser(user.id);
      expect(tokens).toHaveLength(2);
      const revokedTokens = tokens.filter((t) => t.revoked_at !== null);
      const activeTokens = tokens.filter((t) => t.revoked_at === null);
      expect(revokedTokens).toHaveLength(1);
      expect(activeTokens).toHaveLength(1);

      await expect(
        refreshHandler.execute({
          refreshToken: loginA.refreshToken,
          deviceInfo: deviceA,
        })
      ).rejects.toThrow();

      const refreshB = await refreshHandler.execute({
        refreshToken: loginB.refreshToken,
        deviceInfo: deviceB,
      });
      expect(refreshB.accessToken).toBeDefined();
    });

    it('reusing a revoked refresh token is rejected and leaves other sessions intact', async () => {
      const user = await seedUser('reuse-detect@example.com', testPassword);

      const loginA = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const loginB = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      const refreshA1 = await refreshHandler.execute({
        refreshToken: loginA.refreshToken,
        deviceInfo: deviceA,
      });

      await expect(
        refreshHandler.execute({
          refreshToken: loginA.refreshToken,
          deviceInfo: deviceA,
        })
      ).rejects.toThrow();

      const refreshB = await refreshHandler.execute({
        refreshToken: loginB.refreshToken,
        deviceInfo: deviceB,
      });

      expect(refreshB.accessToken).toBeDefined();

      await expect(
        refreshHandler.execute({
          refreshToken: refreshA1.refreshToken,
          deviceInfo: deviceA,
        })
      ).resolves.toBeDefined();
    });

    it('access tokens remain verifiable after refresh token rotation', async () => {
      const user = await seedUser('access-stable@example.com', testPassword);

      const loginResult = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const payloadBefore = jwtAdapter.verifyAccessToken(loginResult.accessToken);
      expect(payloadBefore.userId.value).toBe(user.id);

      const refreshResult = await refreshHandler.execute({
        refreshToken: loginResult.refreshToken,
        deviceInfo: deviceA,
      });

      const payloadAfter = jwtAdapter.verifyAccessToken(refreshResult.accessToken);
      expect(payloadAfter.userId.value).toBe(user.id);
    });
  });

  describe('US-3: Per-Device Secure Logout', () => {
    it('logout from device A leaves device B session fully functional', async () => {
      const user = await seedUser('secure-logout-isolation@example.com', testPassword);

      const loginA = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const loginB = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      await logoutHandler.execute({
        userId: user.id,
        tokenHash: hashRefreshToken(loginA.refreshToken),
      });

      const tokens = await getAllRefreshTokensForUser(user.id);
      const revokedTokens = tokens.filter((t) => t.revoked_at !== null);
      const activeTokens = tokens.filter((t) => t.revoked_at === null);
      expect(revokedTokens).toHaveLength(1);
      expect(activeTokens).toHaveLength(1);

      await expect(
        refreshHandler.execute({
          refreshToken: loginA.refreshToken,
          deviceInfo: deviceA,
        })
      ).rejects.toThrow();

      const refreshB = await refreshHandler.execute({
        refreshToken: loginB.refreshToken,
        deviceInfo: deviceB,
      });
      expect(refreshB.accessToken).toBeDefined();
      expect(refreshB.refreshToken).toBeDefined();
    });

    it('sequential logout from all devices leaves no active sessions', async () => {
      const user = await seedUser('logout-all-devices@example.com', testPassword);

      const loginA = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const loginB = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      const loginC = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: 'Mozilla/5.0 (Device C)',
      });

      await logoutHandler.execute({
        userId: user.id,
        tokenHash: hashRefreshToken(loginA.refreshToken),
      });

      await logoutHandler.execute({
        userId: user.id,
        tokenHash: hashRefreshToken(loginB.refreshToken),
      });

      await logoutHandler.execute({
        userId: user.id,
        tokenHash: hashRefreshToken(loginC.refreshToken),
      });

      const tokens = await getAllRefreshTokensForUser(user.id);
      expect(tokens).toHaveLength(3);
      expect(tokens.every((t) => t.revoked_at !== null)).toBe(true);
      expect(tokens.filter((t) => t.revoked_at === null)).toHaveLength(0);
    });

    it('session list shows only active sessions after partial logout', async () => {
      const user = await seedUser('session-list-after-logout@example.com', testPassword);

      await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const loginB = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: 'Mozilla/5.0 (Device C)',
      });

      const beforeLogout = await listSessionsHandler.execute({
        userId: user.id,
        currentTokenHash: hashRefreshToken(loginB.refreshToken),
      });
      expect(beforeLogout.sessions).toHaveLength(3);

      await logoutHandler.execute({
        userId: user.id,
        tokenHash: hashRefreshToken(loginB.refreshToken),
      });

      const afterLogout = await listSessionsHandler.execute({
        userId: user.id,
        currentTokenHash: hashRefreshToken(loginB.refreshToken),
      });
      expect(afterLogout.sessions).toHaveLength(2);
      expect(afterLogout.sessions.some((s) => s.deviceInfo === deviceB)).toBe(false);
      expect(afterLogout.sessions.every((s) => s.deviceInfo !== deviceB)).toBe(true);
    });

    it('revoking another device session via revoke-session preserves current session', async () => {
      const user = await seedUser('revoke-other-session@example.com', testPassword);

      const loginA = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const loginB = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      const tokens = await getAllRefreshTokensForUser(user.id);
      const sessionB = tokens.find((t) => t.device_info === deviceB);
      expect(sessionB).toBeDefined();

      const result = await revokeSessionHandler.execute({
        userId: user.id,
        sessionId: sessionB!.id,
        currentTokenHash: hashRefreshToken(loginA.refreshToken),
      });

      expect(result.wasCurrentSession).toBe(false);

      const tokensAfter = await getAllRefreshTokensForUser(user.id);
      const revokedTokens = tokensAfter.filter((t) => t.revoked_at !== null);
      const activeTokens = tokensAfter.filter((t) => t.revoked_at === null);
      expect(revokedTokens).toHaveLength(1);
      expect(activeTokens).toHaveLength(1);

      await expect(
        refreshHandler.execute({
          refreshToken: loginB.refreshToken,
          deviceInfo: deviceB,
        })
      ).rejects.toThrow();

      const refreshA = await refreshHandler.execute({
        refreshToken: loginA.refreshToken,
        deviceInfo: deviceA,
      });
      expect(refreshA.accessToken).toBeDefined();
    });

    it('revoked refresh token cannot be used after logout', async () => {
      const user = await seedUser('revoked-token-rejected@example.com', testPassword);

      const loginResult = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      await logoutHandler.execute({
        userId: user.id,
        tokenHash: hashRefreshToken(loginResult.refreshToken),
      });

      await expect(
        refreshHandler.execute({
          refreshToken: loginResult.refreshToken,
          deviceInfo: deviceA,
        })
      ).rejects.toThrow();
    });

    it('logout preserves other user sessions entirely', async () => {
      const userA = await seedUser('user-a-sessions@example.com', testPassword);
      const userB = await seedUser('user-b-sessions@example.com', testPassword);

      const loginA = await loginHandler.execute({
        email: userA.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      const loginB = await loginHandler.execute({
        email: userB.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      await logoutHandler.execute({
        userId: userA.id,
        tokenHash: hashRefreshToken(loginA.refreshToken),
      });

      const tokensA = await getAllRefreshTokensForUser(userA.id);
      const tokensB = await getAllRefreshTokensForUser(userB.id);

      expect(tokensA).toHaveLength(1);
      expect(tokensA[0].revoked_at).not.toBeNull();
      expect(tokensB).toHaveLength(1);
      expect(tokensB[0].revoked_at).toBeNull();

      const refreshB = await refreshHandler.execute({
        refreshToken: loginB.refreshToken,
        deviceInfo: deviceB,
      });
      expect(refreshB.accessToken).toBeDefined();
    });

    it('device info is preserved on remaining sessions after partial logout', async () => {
      const user = await seedUser('device-info-preserved@example.com', testPassword);

      const loginA = await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceA,
      });

      await loginHandler.execute({
        email: user.email,
        password: testPassword,
        deviceInfo: deviceB,
      });

      await logoutHandler.execute({
        userId: user.id,
        tokenHash: hashRefreshToken(loginA.refreshToken),
      });

      const tokens = await getAllRefreshTokensForUser(user.id);
      const activeToken = tokens.find((t) => t.revoked_at === null);
      expect(activeToken).toBeDefined();
      expect(activeToken!.device_info).toBe(deviceB);
    });
  });
});
