import { describe, it, expect, vi } from 'vitest';
import { ListSessionsHandler } from './handler';
import { UserId } from '../../domain/value_objects/user_id';
import { RefreshTokenId } from '../../domain/value_objects/refresh_token_id';
import { RefreshToken } from '../../domain/entities/refresh_token';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';

const TEST_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const TEST_TOKEN_1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const TEST_TOKEN_2 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';

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

function createMockRefreshTokenRepository(tokens: RefreshToken[]) {
  return {
    findById: vi.fn(),
    findByTokenHash: vi.fn(),
    findActiveByUserId: vi.fn(),
    findAllActiveByUserId: vi.fn().mockResolvedValue(tokens),
    countActiveByUserId: vi.fn(),
    revokeOldestForUser: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    updateLastUsedAt: vi.fn(),
    revokeAllForUser: vi.fn(),
    deleteAllByUserId: vi.fn(),
  };
}

function createRefreshToken(
  id: string,
  userId: string,
  deviceInfo: string | null = null,
  revokedAt: Date | null = null
): RefreshToken {
  const token = RefreshToken.create(
    new RefreshTokenId(id),
    new UserId(userId),
    'hash-' + id,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    deviceInfo ?? undefined
  );
  if (revokedAt) {
    token.revoke();
  }
  return token;
}

describe('ListSessionsHandler', () => {
  it('should return sessions for a valid user', async () => {
    const userRepository = createMockUserRepository(true);
    const tokens = [
      createRefreshToken(TEST_TOKEN_1, TEST_USER_ID, 'Chrome on macOS'),
      createRefreshToken(TEST_TOKEN_2, TEST_USER_ID, 'Safari on iOS'),
    ];
    const refreshTokenRepository = createMockRefreshTokenRepository(tokens);

    const handler = new ListSessionsHandler({
      userRepository,
      refreshTokenRepository,
    });

    const result = await handler.execute({
      userId: TEST_USER_ID,
      currentTokenHash: 'hash-' + TEST_TOKEN_1,
    });

    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0].id).toBe(TEST_TOKEN_1);
    expect(result.sessions[0].deviceInfo).toBe('Chrome on macOS');
    expect(result.sessions[0].isCurrent).toBe(true);
    expect(result.sessions[1].id).toBe(TEST_TOKEN_2);
    expect(result.sessions[1].isCurrent).toBe(false);
    expect(userRepository.findById).toHaveBeenCalledWith(expect.any(UserId));
    expect(refreshTokenRepository.findAllActiveByUserId).toHaveBeenCalledWith(expect.any(UserId));
  });

  it('should mark no session as current when token hash is not provided', async () => {
    const userRepository = createMockUserRepository(true);
    const tokens = [createRefreshToken(TEST_TOKEN_1, TEST_USER_ID, 'Chrome on macOS')];
    const refreshTokenRepository = createMockRefreshTokenRepository(tokens);

    const handler = new ListSessionsHandler({
      userRepository,
      refreshTokenRepository,
    });

    const result = await handler.execute({
      userId: TEST_USER_ID,
    });

    expect(result.sessions[0].isCurrent).toBe(false);
  });

  it('should return empty sessions when user has no active sessions', async () => {
    const userRepository = createMockUserRepository(true);
    const refreshTokenRepository = createMockRefreshTokenRepository([]);

    const handler = new ListSessionsHandler({
      userRepository,
      refreshTokenRepository,
    });

    const result = await handler.execute({ userId: TEST_USER_ID });

    expect(result.sessions).toHaveLength(0);
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    const userRepository = createMockUserRepository(false);
    const refreshTokenRepository = createMockRefreshTokenRepository([]);

    const handler = new ListSessionsHandler({
      userRepository,
      refreshTokenRepository,
    });

    await expect(handler.execute({ userId: TEST_USER_ID })).rejects.toThrow(UserNotFoundError);
  });
});
