import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository } from '../repositories/user_repository';
import { User } from '../../../domain/entities/user';
import { UserId } from '../../../domain/value_objects/user_id';
import { Email } from '../../../domain/value_objects/email';
import { IDatabase } from 'pg-promise';

describe('UserRepository', () => {
  let mockDb: IDatabase<object>;
  let userRepository: UserRepository;

  beforeEach(() => {
    mockDb = {
      oneOrNone: vi.fn(),
      none: vi.fn(),
    } as unknown as IDatabase<object>;
    userRepository = new UserRepository(mockDb);
  });

  const createTestUser = (): User => {
    const userId = UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789');
    const email = Email.create('test@example.com');
    return User.create(userId, email, 'hashedPassword123');
  };

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const user = createTestUser();
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: user.getId().value,
        email: user.email.value,
        password_hash: user.password.hash,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      });

      const result = await userRepository.findByEmail(user.email);

      expect(result).not.toBeNull();
      expect(result?.email.value).toBe(user.email.value);
    });

    it('should return null when user not found', async () => {
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const email = Email.create('nonexistent@example.com');
      const result = await userRepository.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = createTestUser();
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: user.getId().value,
        email: user.email.value,
        password_hash: user.password.hash,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      });

      const result = await userRepository.findById(user.getId());

      expect(result).not.toBeNull();
      expect(result?.getId().value).toBe(user.getId().value);
    });

    it('should return null when user not found', async () => {
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const userId = UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789');
      const result = await userRepository.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should insert user into database', async () => {
      const user = createTestUser();
      (mockDb.none as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await userRepository.save(user);

      expect(mockDb.none).toHaveBeenCalledTimes(1);
      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          user.getId().value,
          user.email.value,
          user.password.hash,
        ])
      );
    });
  });

  describe('update', () => {
    it('should update user in database', async () => {
      const user = createTestUser();
      (mockDb.none as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await userRepository.update(user);

      expect(mockDb.none).toHaveBeenCalledTimes(1);
      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([
          user.getId().value,
          user.email.value,
        ])
      );
    });
  });

  describe('delete', () => {
    it('should delete user from database', async () => {
      const userId = UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789');
      (mockDb.none as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await userRepository.delete(userId);

      expect(mockDb.none).toHaveBeenCalledTimes(1);
      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users'),
        [userId.value]
      );
    });
  });
});
