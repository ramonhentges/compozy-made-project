import { describe, it, expect } from 'vitest';
import { UserMapper } from './user_mapper';
import { User } from '../../../domain/entities/user';
import { UserId } from '../../../domain/value_objects/user_id';
import { Email } from '../../../domain/value_objects/email';
import { Name } from '../../../domain/value_objects/name';

describe('UserMapper', () => {
  const validName = 'John Doe';
  const validNameVO = Name.create(validName);

  const createTestUser = (): User => {
    const userId = UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789');
    const email = Email.create('test@example.com');
    return User.create(userId, email, validNameVO, 'hashedPassword123');
  };

  describe('toDomain', () => {
    it('should convert DTO to User entity', () => {
      const dto = {
        id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
        email: 'test@example.com',
        name: validName,
        password_hash: 'hashedPassword123',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      const user = UserMapper.toDomain(dto);

      expect(user).toBeInstanceOf(User);
      expect(user.getId().value).toBe(dto.id);
      expect(user.email.value).toBe(dto.email);
      expect(user.name.value).toBe(dto.name);
      expect(user.password.hash).toBe(dto.password_hash);
    });
  });

  describe('toDTO', () => {
    it('should convert User entity to DTO', () => {
      const user = createTestUser();

      const dto = UserMapper.toDTO(user);

      expect(dto.id).toBe(user.getId().value);
      expect(dto.email).toBe(user.email.value);
      expect(dto.name).toBe(user.name.value);
      expect(dto.password_hash).toBe(user.password.hash);
      expect(dto.created_at).toBe(user.createdAt);
      expect(dto.updated_at).toBe(user.updatedAt);
    });
  });

  describe('round-trip', () => {
    it('should preserve user data through toDTO and toDomain', () => {
      const originalUser = createTestUser();

      const dto = UserMapper.toDTO(originalUser);
      const reconstructedUser = UserMapper.toDomain(dto);

      expect(reconstructedUser.getId().value).toBe(originalUser.getId().value);
      expect(reconstructedUser.email.value).toBe(originalUser.email.value);
      expect(reconstructedUser.name.value).toBe(originalUser.name.value);
      expect(reconstructedUser.password.hash).toBe(originalUser.password.hash);
    });
  });
});
