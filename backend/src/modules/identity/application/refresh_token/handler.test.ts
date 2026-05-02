import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshTokenHandler } from './handler';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IRefreshTokenRepository } from '../../domain/repository/refresh_token_repository';
import { ITokenService } from '../../domain/services/token_service';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid_refresh_token_error';
import { RefreshTokenReusedError } from '../../domain/errors/refresh_token_reused_error';
import { User } from '../../domain/entities/user';
import { RefreshToken } from '../../domain/entities/refresh_token';
import { Email } from '../../domain/value_objects/email';
import { Name } from '../../domain/value_objects/name';
import { UserId } from '../../domain/value_objects/user_id';
import { RefreshTokenId } from '../../domain/value_objects/refresh_token_id';
import { hashRefreshToken } from '../../infrastructure/utils/hash_refresh_token';

describe('RefreshTokenHandler', () => {
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validEmail = 'test@example.com';
  const validName = 'John Doe';
  const hashedPassword = '$2b$12$hashedpassword1234567890123456789012';

  let mockUserRepository: IUserRepository;
  let mockRefreshTokenRepository: IRefreshTokenRepository;
  let mockTokenService: ITokenService;
  let handler: RefreshTokenHandler;

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

    mockTokenService = {
      generateAccessToken: vi.fn().mockReturnValue('new-access-token'),
      generateRefreshToken: vi.fn().mockReturnValue('new-refresh-token'),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn().mockReturnValue({
        userId: UserId.create(validUserId),
        email: validEmail,
        type: 'refresh' as const,
      }),
      getRefreshTokenExpiry: vi.fn().mockReturnValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    };

    handler = new RefreshTokenHandler({
      userRepository: mockUserRepository,
      refreshTokenRepository: mockRefreshTokenRepository,
      tokenService: mockTokenService,
    });
  });

  describe('execute', () => {
    it('should return new tokens and user on valid refresh token and rotate token', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);
      const existingToken = RefreshToken.create(
        RefreshTokenId.create(),
        userId,
        hashRefreshToken('valid-refresh-token'),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(existingToken);

      const result = await handler.execute({ refreshToken: 'valid-refresh-token' });

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.user).toEqual({
        id: validUserId,
        email: validEmail,
        name: validName,
      });
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRefreshTokenRepository.findByTokenHash).toHaveBeenCalledWith(hashRefreshToken('valid-refresh-token'));
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(existingToken);
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledOnce();
      expect(existingToken.isRevoked()).toBe(true);
      const savedToken = (mockRefreshTokenRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedToken.deviceInfo).toBeNull();
    });

    it('should preserve device info from existing token when not overridden', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);
      const existingToken = RefreshToken.create(
        RefreshTokenId.create(),
        userId,
        hashRefreshToken('valid-refresh-token'),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        'Test Device'
      );

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(existingToken);

      await handler.execute({ refreshToken: 'valid-refresh-token' });

      const savedToken = (mockRefreshTokenRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedToken.deviceInfo).toBe('Test Device');
    });

    it('should allow overriding device info from existing token', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);
      const existingToken = RefreshToken.create(
        RefreshTokenId.create(),
        userId,
        hashRefreshToken('valid-refresh-token'),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        'Old Device'
      );

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(existingToken);

      await handler.execute({ refreshToken: 'valid-refresh-token', deviceInfo: 'New Device' });

      const savedToken = (mockRefreshTokenRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedToken.deviceInfo).toBe('New Device');
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      mockUserRepository.findById = vi.fn().mockResolvedValue(null);

      await expect(
        handler.execute({ refreshToken: 'valid-refresh-token' })
      ).rejects.toThrow(UserNotFoundError);
    });

    it('should throw when refresh token is invalid', async () => {
      mockTokenService.verifyRefreshToken = vi.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        handler.execute({ refreshToken: 'invalid-refresh-token' })
      ).rejects.toThrow('Invalid token');
    });

    it('should throw InvalidRefreshTokenError when refresh token not found', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(null);

      await expect(
        handler.execute({ refreshToken: 'valid-refresh-token' })
      ).rejects.toThrow(InvalidRefreshTokenError);
    });

    it('should throw InvalidRefreshTokenError when refresh token is expired', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);
      const expiredToken = RefreshToken.create(
        RefreshTokenId.create(),
        userId,
        hashRefreshToken('valid-refresh-token'),
        new Date(Date.now() - 1000)
      );

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(expiredToken);

      await expect(
        handler.execute({ refreshToken: 'valid-refresh-token' })
      ).rejects.toThrow(InvalidRefreshTokenError);
    });

    it('should throw RefreshTokenReusedError and revoke all tokens when a revoked token is presented', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);
      const revokedToken = RefreshToken.create(
        RefreshTokenId.create(),
        userId,
        hashRefreshToken('revoked-refresh-token'),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );
      revokedToken.revoke();

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(revokedToken);

      await expect(
        handler.execute({ refreshToken: 'revoked-refresh-token' })
      ).rejects.toThrow(RefreshTokenReusedError);

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(revokedToken);
      expect(mockRefreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(userId);
      expect(mockRefreshTokenRepository.save).not.toHaveBeenCalled();

      const events = revokedToken.pullDomainEvents();
      const reusedEvent = events.find((e: any) => e.eventName === 'RefreshTokenReused');
      expect(reusedEvent).toBeDefined();
      expect(reusedEvent!.data).toEqual({ userId: validUserId });
    });

    it('should throw InvalidRefreshTokenError when refresh token is not found', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);
      mockRefreshTokenRepository.findByTokenHash = vi.fn().mockResolvedValue(null);

      await expect(
        handler.execute({ refreshToken: 'unknown-refresh-token' })
      ).rejects.toThrow(InvalidRefreshTokenError);

      expect(mockRefreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled();
    });
  });
});
