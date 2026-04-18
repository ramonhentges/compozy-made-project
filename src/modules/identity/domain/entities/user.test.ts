import { describe, it, expect } from 'vitest';
import { User } from '../entities/user';
import { Email } from '../value_objects/email';
import { UserId } from '../value_objects/user_id';
import { UserRegisteredEvent } from '../events/user_registered';

describe('User', () => {
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validEmail = 'test@example.com';
  const validPasswordHash = '$2b$12$hashedpassword1234567890123456789012';

  describe('create', () => {
    it('should create a user with correct properties', () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);

      const user = User.create(userId, email, validPasswordHash);

      expect(user.getId().value).toBe(validUserId);
      expect(user.email.value).toBe(validEmail);
      expect(user.password.hash).toBe(validPasswordHash);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate UserRegisteredEvent on creation', () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);

      const user = User.create(userId, email, validPasswordHash);

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserRegisteredEvent);
      const registeredEvent = events[0] as UserRegisteredEvent;
      expect(registeredEvent.userId.value).toBe(validUserId);
      expect(registeredEvent.email.value).toBe(validEmail);
    });

    it('should not have events after pulling them', () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);

      const user = User.create(userId, email, validPasswordHash);
      user.pullDomainEvents();

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('changePassword', () => {
    it('should change password', () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);
      const newHash = '$2b$12$newpasswordhash123456789012';

      const user = User.create(userId, email, validPasswordHash);

      user.changePassword(newHash);

      expect(user.password.hash).toBe(newHash);
    });
  });

  describe('equality', () => {
    it('should return same ID for same user', () => {
      const userId = UserId.create(validUserId);
      const email = Email.create(validEmail);

      const user = User.create(userId, email, validPasswordHash);

      expect(user.getId().equals(userId)).toBe(true);
    });
  });
});
