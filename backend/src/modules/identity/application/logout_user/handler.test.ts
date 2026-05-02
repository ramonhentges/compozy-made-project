import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutUserHandler } from './handler';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IRefreshTokenRepository } from '../../domain/repository/refresh_token_repository';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid_refresh_token_error';
import { UnauthorizedSessionError } from '../../domain/errors/unauthorized_session_error';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value_objects/email';
import { Name } from '../../domain/value_objects/name';
import { UserId } from '../../domain/value_objects/user_id';
import { RefreshTokenId } from '../../domain/value_objects/refresh_token_id';
import { RefreshToken } from '../../domain/entities/refresh_token';

describe('LogoutUserHandler', () => {
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validEmail = 'test@example.com';
  const validName = 'John Doe';
  const hashedPassword = '$2b$12$hashedpassword1234567890123456789012';
  const tokenHash = 'abc123hash';

  let mockUserRepository: IUserRepository;
  let mockRefreshTokenRepository: IRefreshTokenRepository;
  let handler: LogoutUserHandler;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockRefreshTokenRepository = {
      findById: vi.fn(),
      findByTokenHash: vi.fn(),
      findActiveByUserId: vi.fn(),
      findAllActiveByUserId: vi.fn(),
      countActiveByUserId: vi.fn(),
      revokeOldestForUser: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      updateLastUsedAt: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteAllByUserId: vi.fn(),
    };

    handler = new LogoutUserHandler({
      userRepository: mockUserRepository,
      refreshTokenRepository: mockRefreshTokenRepository,
    });
  });

  describe('execute', () => {
    it('should revoke only the current refresh token for the user', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);
      const token = RefreshToken.create(
        new RefreshTokenId('550e8400-e29b-41d4-a716-446655440001'),
        userId,
        tokenHash,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        'Chrome on macOS'
      );

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(token);

      await expect(handler.execute({ userId: validUserId, tokenHash })).resolves.toBeUndefined();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(UserId.create(validUserId));
      expect(mockRefreshTokenRepository.findByTokenHash).toHaveBeenCalledWith(tokenHash);
      expect(token.isRevoked()).toBe(true);
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(token);
    });

    it('should throw when user not found', async () => {
      mockUserRepository.findById = vi.fn().mockResolvedValue(null);

      await expect(handler.execute({ userId: validUserId, tokenHash })).rejects.toThrow(UserNotFoundError);
    });

    it('should throw InvalidRefreshTokenError when token not found', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(null);

      await expect(handler.execute({ userId: validUserId, tokenHash })).rejects.toThrow(InvalidRefreshTokenError);
    });

    it('should throw UnauthorizedSessionError when token belongs to another user', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);
      const otherUserId = UserId.create('550e8400-e29b-41d4-a716-446655440001');
      const token = RefreshToken.create(
        new RefreshTokenId('550e8400-e29b-41d4-a716-446655440002'),
        otherUserId,
        tokenHash,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        'Chrome on macOS'
      );

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(token);

      await expect(handler.execute({ userId: validUserId, tokenHash })).rejects.toThrow(UnauthorizedSessionError);
    });
  });
});
