import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUserHandler, DuplicateEmailError, InvalidPasswordError } from './handler';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IPasswordHasher } from '../../domain/services/password_hasher';
import { UserId } from '../../domain/value_objects/user_id';

describe('RegisterUserHandler', () => {
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validEmail = 'test@example.com';
  const validPassword = 'Password123!';
  const hashedPassword = '$2b$12$hashedpassword1234567890123456789012';

  let mockUserRepository: IUserRepository;
  let mockPasswordHasher: IPasswordHasher;
  let mockGenerateUserId: () => UserId;
  let handler: RegisterUserHandler;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockPasswordHasher = {
      hash: vi.fn().mockResolvedValue(hashedPassword),
      verify: vi.fn(),
    };

    mockGenerateUserId = vi.fn().mockReturnValue(UserId.create(mockUserId));

    handler = new RegisterUserHandler({
      userRepository: mockUserRepository,
      passwordHasher: mockPasswordHasher,
      generateUserId: mockGenerateUserId,
    });
  });

  describe('execute', () => {
    it('should create user with hashed password', async () => {
      const result = await handler.execute({
        email: validEmail,
        password: validPassword,
      });

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(validPassword);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(result.email).toBe(validEmail);
      expect(result.userId).toBe(mockUserId);
    });

    it('should reject duplicate email', async () => {
      const mockUser = {} as any;
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);

      await expect(
        handler.execute({
          email: validEmail,
          password: validPassword,
        })
      ).rejects.toThrow(DuplicateEmailError);
    });

    it('should reject weak passwords - too short', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'Short1!',
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - no uppercase', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'password123!',
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - no lowercase', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'PASSWORD123!',
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - no digit', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'PasswordABC!',
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - no special character', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'Password123',
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - empty', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: '',
        })
      ).rejects.toThrow(InvalidPasswordError);
    });
  });
});