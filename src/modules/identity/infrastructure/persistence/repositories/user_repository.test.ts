import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository } from '../repositories/user_repository';
import { User } from '../../../domain/entities/user';
import { UserId } from '../../../domain/value_objects/user_id';
import { Email } from '../../../domain/value_objects/email';
import { IDatabase } from 'pg-promise';
import { buildBatchInsertSQL } from '../sql/outbox_sql';

describe('UserRepository', () => {
  let mockDb: IDatabase<object>;
  let mockTransaction: { none: ReturnType<typeof vi.fn> };
  let userRepository: UserRepository;

  beforeEach(() => {
    mockTransaction = {
      none: vi.fn().mockResolvedValue(undefined),
    };
    mockDb = {
      oneOrNone: vi.fn(),
      none: vi.fn(),
      tx: vi.fn(async (callback) => callback(mockTransaction)),
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
    it('should start a transaction and insert user plus UserRegistered outbox row', async () => {
      const user = createTestUser();

      await userRepository.save(user);

      expect(mockDb.tx).toHaveBeenCalledTimes(1);
      expect(mockTransaction.none).toHaveBeenCalledTimes(2);
      expect(mockTransaction.none).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          user.getId().value,
          user.email.value,
          user.password.hash,
        ])
      );
      expect(mockTransaction.none).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO events'),
        expect.arrayContaining([
          expect.any(String),
          'UserRegistered',
          1,
          'User',
          user.getId().value,
          JSON.stringify({ email: user.email.value }),
          'pending',
          0,
        ])
      );
    });

    it('should clear domain events when user insert fails', async () => {
      const user = createTestUser();
      mockTransaction.none.mockRejectedValueOnce(new Error('insert failed'));

      await expect(userRepository.save(user)).rejects.toThrow('insert failed');

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(0);
    });

    it('should clear domain events when outbox insert fails', async () => {
      const user = createTestUser();
      mockTransaction.none
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('outbox failed'));

      await expect(userRepository.save(user)).rejects.toThrow('outbox failed');

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(0);
    });

    it('should clear domain events after successful persistence', async () => {
      const user = createTestUser();

      await userRepository.save(user);

      expect(user.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should start a transaction and update user plus PasswordChanged outbox row', async () => {
      const user = createTestUser();
      user.pullDomainEvents();
      user.changePassword('newHashedPassword123');

      await userRepository.update(user);

      expect(mockDb.tx).toHaveBeenCalledTimes(1);
      expect(mockTransaction.none).toHaveBeenCalledTimes(2);
      expect(mockTransaction.none).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([
          user.getId().value,
          user.email.value,
        ])
      );
      expect(mockTransaction.none).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO events'),
        expect.arrayContaining([
          expect.any(String),
          'PasswordChanged',
          1,
          'User',
          user.getId().value,
          JSON.stringify(null),
          'pending',
          0,
        ])
      );
    });

    it('should clear domain events when user update fails', async () => {
      const user = createTestUser();
      user.pullDomainEvents();
      user.changePassword('newHashedPassword123');
      mockTransaction.none.mockRejectedValueOnce(new Error('update failed'));

      await expect(userRepository.update(user)).rejects.toThrow('update failed');

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(0);
    });

    it('should clear domain events when outbox insert fails', async () => {
      const user = createTestUser();
      user.pullDomainEvents();
      user.changePassword('newHashedPassword123');
      mockTransaction.none
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('outbox failed'));

      await expect(userRepository.update(user)).rejects.toThrow('outbox failed');

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(0);
    });

    it('should clear domain events after successful update', async () => {
      const user = createTestUser();
      user.pullDomainEvents();
      user.changePassword('newHashedPassword123');

      await userRepository.update(user);

      expect(user.pullDomainEvents()).toHaveLength(0);
    });

    it('should not insert outbox rows when there are no domain events', async () => {
      const user = createTestUser();
      user.pullDomainEvents();

      await userRepository.update(user);

      expect(mockDb.tx).toHaveBeenCalledTimes(1);
      expect(mockTransaction.none).toHaveBeenCalledTimes(1);
      expect(mockTransaction.none).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('UPDATE users'),
        expect.any(Array)
      );
    });

    it('should not insert duplicate outbox rows on re-save with no new events', async () => {
      const user = createTestUser();
      user.pullDomainEvents();
      user.changePassword('newHashedPassword123');

      await userRepository.update(user);
      mockTransaction.none.mockClear();

      await userRepository.update(user);

      expect(mockTransaction.none).toHaveBeenCalledTimes(1);
      expect(mockTransaction.none).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.any(Array)
      );
    });
  });

  describe('delete', () => {
    it('should delete user from database', async () => {
      const userId = UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789');

      await userRepository.delete(userId);

      expect(mockDb.tx).toHaveBeenCalledTimes(1);
      expect(mockTransaction.none).toHaveBeenCalledTimes(1);
      expect(mockTransaction.none).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users'),
        [userId.value]
      );
    });
  });
});
