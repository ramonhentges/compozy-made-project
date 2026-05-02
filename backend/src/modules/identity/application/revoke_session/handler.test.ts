import { describe, it, expect, vi } from 'vitest';
import { RevokeSessionHandler } from './handler';
import { UserId } from '../../domain/value_objects/user_id';
import { RefreshTokenId } from '../../domain/value_objects/refresh_token_id';
import { RefreshToken } from '../../domain/entities/refresh_token';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';
import { SessionNotFoundError } from '../../domain/errors/session_not_found_error';
import { UnauthorizedSessionError } from '../../domain/errors/unauthorized_session_error';

const TEST_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const TEST_OTHER_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
const TEST_TOKEN_1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

function createMockUserRepository(userExists: boolean) {
  return {
    findById: vi.fn().mockResolvedValue(
      userExists
        ? {
            getId: () => UserId.create(TEST_USER_ID),
            email: { value: 'test@example.com' },
            name: { value: 'Test User' },
          }
        : null
    ),
    findByEmail: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

function createMockRefreshTokenRepository(token: RefreshToken | null) {
  return {
    findById: vi.fn().mockResolvedValue(token),
    findByTokenHash: vi.fn(),
    findActiveByUserId: vi.fn(),
    findAllActiveByUserId: vi.fn(),
    countActiveByUserId: vi.fn(),
    revokeOldestForUser: vi.fn(),
    save: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    updateLastUsedAt: vi.fn(),
    revokeAllForUser: vi.fn(),
    deleteAllByUserId: vi.fn(),
  };
}

function createRefreshToken(
  id: string,
  userId: string,
  revokedAt: Date | null = null
): RefreshToken {
  const token = RefreshToken.create(
    new RefreshTokenId(id),
    new UserId(userId),
    'hash-' + id,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    'Chrome on macOS'
  );
  if (revokedAt) {
    token.revoke();
  }
  return token;
}

describe('RevokeSessionHandler', () => {
  it('should revoke a valid session belonging to the user', async () => {
    const userRepository = createMockUserRepository(true);
    const token = createRefreshToken(TEST_TOKEN_1, TEST_USER_ID);
    const refreshTokenRepository = createMockRefreshTokenRepository(token);

    const handler = new RevokeSessionHandler({
      userRepository,
      refreshTokenRepository,
    });

    const result = await handler.execute({ userId: TEST_USER_ID, sessionId: TEST_TOKEN_1 });

    expect(token.isRevoked()).toBe(true);
    expect(refreshTokenRepository.update).toHaveBeenCalledWith(token);
    expect(result.wasCurrentSession).toBe(false);
  });

  it('should indicate when current session is revoked', async () => {
    const userRepository = createMockUserRepository(true);
    const token = createRefreshToken(TEST_TOKEN_1, TEST_USER_ID);
    const refreshTokenRepository = createMockRefreshTokenRepository(token);

    const handler = new RevokeSessionHandler({
      userRepository,
      refreshTokenRepository,
    });

    const result = await handler.execute({
      userId: TEST_USER_ID,
      sessionId: TEST_TOKEN_1,
      currentTokenHash: token.tokenHash,
    });

    expect(result.wasCurrentSession).toBe(true);
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    const userRepository = createMockUserRepository(false);
    const refreshTokenRepository = createMockRefreshTokenRepository(null);

    const handler = new RevokeSessionHandler({
      userRepository,
      refreshTokenRepository,
    });

    await expect(
      handler.execute({ userId: TEST_USER_ID, sessionId: TEST_TOKEN_1 })
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should throw SessionNotFoundError when session does not exist', async () => {
    const userRepository = createMockUserRepository(true);
    const refreshTokenRepository = createMockRefreshTokenRepository(null);

    const handler = new RevokeSessionHandler({
      userRepository,
      refreshTokenRepository,
    });

    await expect(
      handler.execute({ userId: TEST_USER_ID, sessionId: TEST_TOKEN_1 })
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('should throw UnauthorizedSessionError when session belongs to another user', async () => {
    const userRepository = createMockUserRepository(true);
    const token = createRefreshToken(TEST_TOKEN_1, TEST_OTHER_USER_ID);
    const refreshTokenRepository = createMockRefreshTokenRepository(token);

    const handler = new RevokeSessionHandler({
      userRepository,
      refreshTokenRepository,
    });

    await expect(
      handler.execute({ userId: TEST_USER_ID, sessionId: TEST_TOKEN_1 })
    ).rejects.toThrow(UnauthorizedSessionError);
  });

  it('should throw SessionNotFoundError when session is already revoked', async () => {
    const userRepository = createMockUserRepository(true);
    const token = createRefreshToken(TEST_TOKEN_1, TEST_USER_ID, new Date());
    const refreshTokenRepository = createMockRefreshTokenRepository(token);

    const handler = new RevokeSessionHandler({
      userRepository,
      refreshTokenRepository,
    });

    await expect(
      handler.execute({ userId: TEST_USER_ID, sessionId: TEST_TOKEN_1 })
    ).rejects.toThrow(SessionNotFoundError);
  });
});
