import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUserHandler } from './handler';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IRefreshTokenRepository } from '../../domain/repository/refresh_token_repository';
import { IPasswordHasher } from '../../domain/services/password_hasher';
import { ITokenService, TokenPayload } from '../../domain/services/token_service';
import { InvalidCredentialsError } from '../../domain/errors/invalid_credentials_error';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value_objects/email';
import { Name } from '../../domain/value_objects/name';
import { UserId } from '../../domain/value_objects/user_id';

describe('LoginUserHandler', () => {
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validEmail = 'test@example.com';
  const validName = 'John Doe';
  const validPassword = 'password123';
  const hashedPassword = '$2b$12$hashedpassword1234567890123456789012';

  let mockUserRepository: IUserRepository;
  let mockRefreshTokenRepository: IRefreshTokenRepository;
  let mockPasswordHasher: IPasswordHasher;
  let mockTokenService: ITokenService;
  let handler: LoginUserHandler;

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
      countActiveByUserId: vi.fn().mockResolvedValue(0),
      revokeOldestForUser: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      updateLastUsedAt: vi.fn(),
      revokeAllForUser: vi.fn(),
      deleteAllByUserId: vi.fn(),
    };

    mockPasswordHasher = {
      hash: vi.fn(),
      verify: vi.fn(),
    };

    mockTokenService = {
      generateAccessToken: vi.fn().mockReturnValue('access-token'),
      generateRefreshToken: vi.fn().mockReturnValue('refresh-token'),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
      getRefreshTokenExpiry: vi.fn().mockReturnValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    };

    handler = new LoginUserHandler({
      userRepository: mockUserRepository,
      refreshTokenRepository: mockRefreshTokenRepository,
      passwordHasher: mockPasswordHasher,
      tokenService: mockTokenService,
      maxSessionsPerUser: 5,
    });
  });

  describe('execute', () => {
    it('should return tokens on valid credentials and store refresh token', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(user);
      mockPasswordHasher.verify = vi.fn().mockResolvedValue(true);

      const result = await handler.execute({
        email: validEmail,
        password: validPassword,
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toEqual({
        id: validUserId,
        email: validEmail,
        name: validName,
      });
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledOnce();
      const savedToken = (mockRefreshTokenRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedToken.deviceInfo).toBeNull();
    });

    it('should store device info when provided', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(user);
      mockPasswordHasher.verify = vi.fn().mockResolvedValue(true);

      await handler.execute({
        email: validEmail,
        password: validPassword,
        deviceInfo: 'Mozilla/5.0',
      });

      expect(mockRefreshTokenRepository.save).toHaveBeenCalledOnce();
      const savedToken = (mockRefreshTokenRepository.save as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedToken.deviceInfo).toBe('Mozilla/5.0');
    });

    it('should throw on invalid credentials - user not found', async () => {
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);

      await expect(
        handler.execute({
          email: validEmail,
          password: validPassword,
        })
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw on invalid credentials - wrong password', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(user);
      mockPasswordHasher.verify = vi.fn().mockResolvedValue(false);

      await expect(
        handler.execute({
          email: validEmail,
          password: validPassword,
        })
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should revoke oldest session when active session count exceeds limit', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(user);
      mockPasswordHasher.verify = vi.fn().mockResolvedValue(true);
      mockRefreshTokenRepository.countActiveByUserId = vi.fn().mockResolvedValue(5);

      await handler.execute({
        email: validEmail,
        password: validPassword,
      });

      expect(mockRefreshTokenRepository.revokeOldestForUser).toHaveBeenCalledWith(userId, 4);
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledOnce();
    });

    it('should not revoke sessions when active session count is below limit', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const name = Name.create(validName);
      const user = User.create(userId, email, name, hashedPassword);

      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(user);
      mockPasswordHasher.verify = vi.fn().mockResolvedValue(true);
      mockRefreshTokenRepository.countActiveByUserId = vi.fn().mockResolvedValue(3);

      await handler.execute({
        email: validEmail,
        password: validPassword,
      });

      expect(mockRefreshTokenRepository.revokeOldestForUser).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledOnce();
    });
  });
});
