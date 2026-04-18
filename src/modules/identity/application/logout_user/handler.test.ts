import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutUserHandler } from './handler';
import { IUserRepository } from '../../domain/repository/user_repository';
import { UserNotFoundError } from '../../domain/errors/user_not_found_error';
import { User } from '../../domain/entities/user';
import { Email } from '../../domain/value_objects/email';
import { UserId } from '../../domain/value_objects/user_id';

describe('LogoutUserHandler', () => {
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validEmail = 'test@example.com';
  const hashedPassword = '$2b$12$hashedpassword1234567890123456789012';

  let mockUserRepository: IUserRepository;
  let handler: LogoutUserHandler;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    handler = new LogoutUserHandler({
      userRepository: mockUserRepository,
    });
  });

  describe('execute', () => {
    it('should validate session - user exists', async () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const user = User.create(userId, email, hashedPassword);

      mockUserRepository.findById = vi.fn().mockResolvedValue(user);

      await expect(handler.execute(validUserId)).resolves.toBeUndefined();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(UserId.create(validUserId));
    });

    it('should throw when user not found', async () => {
      mockUserRepository.findById = vi.fn().mockResolvedValue(null);

      await expect(handler.execute(validUserId)).rejects.toThrow(UserNotFoundError);
    });
  });
});