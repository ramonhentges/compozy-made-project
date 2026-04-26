import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUserHandler, DuplicateEmailError, InvalidPasswordError } from './handler';
import { IUserRepository } from '../../domain/repository/user_repository';
import { IPasswordHasher } from '../../domain/services/password_hasher';

describe('RegisterUserHandler', () => {
  const validEmail = 'test@example.com';
  const validPassword = 'Password123!';
  const validName = 'John Doe';
  const hashedPassword = '$2b$12$hashedpassword1234567890123456789012';

  let mockUserRepository: IUserRepository;
  let mockPasswordHasher: IPasswordHasher;
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

    handler = new RegisterUserHandler({
      userRepository: mockUserRepository,
      passwordHasher: mockPasswordHasher,
    });
  });

  describe('execute', () => {
    it('should create user with hashed password', async () => {
      const result = await handler.execute({
        email: validEmail,
        password: validPassword,
        name: validName,
      });

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(validPassword);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(result.email).toBe(validEmail);
      expect(result.name).toBe(validName);
      expect(result.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should reject duplicate email', async () => {
      const mockUser = {} as any;
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(mockUser);

      await expect(
        handler.execute({
          email: validEmail,
          password: validPassword,
          name: validName,
        })
      ).rejects.toThrow(DuplicateEmailError);
    });

    it('should reject weak passwords - too short', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'Short1!',
          name: validName,
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - no uppercase', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'password123!',
          name: validName,
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - no lowercase', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'PASSWORD123!',
          name: validName,
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - no digit', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'PasswordABC!',
          name: validName,
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - no special character', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: 'Password123',
          name: validName,
        })
      ).rejects.toThrow(InvalidPasswordError);
    });

    it('should reject weak passwords - empty', async () => {
      await expect(
        handler.execute({
          email: validEmail,
          password: '',
          name: validName,
        })
      ).rejects.toThrow(InvalidPasswordError);
    });
  });
});