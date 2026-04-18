import { describe, it, expect } from 'vitest';
import { UserId, InvalidUserIdError } from '../value_objects/user_id';

describe('UserId', () => {
  describe('validation', () => {
    it('should accept valid UUID v4', () => {
      expect(() => UserId.create('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
      expect(() => UserId.create('6ba7b810-9dad-41d1-80b4-00c04fd430c8')).not.toThrow();
    });

    it('should reject invalid UUID formats', () => {
      expect(() => UserId.create('')).toThrow(InvalidUserIdError);
      expect(() => UserId.create('invalid')).toThrow(InvalidUserIdError);
      expect(() => UserId.create('550e8400-e29b-41d4-a716')).toThrow(InvalidUserIdError);
      expect(() => UserId.create('550e8400-e29b-51d4-a716-446655440000')).toThrow(InvalidUserIdError);
      expect(() => UserId.create('550e8400-e29b-41d4-a716-4466554400000')).toThrow(InvalidUserIdError);
    });
  });

  describe('equality', () => {
    it('should return true for equal user IDs', () => {
      const id1 = UserId.create('550e8400-e29b-41d4-a716-446655440000');
      const id2 = UserId.create('550e8400-e29b-41d4-a716-446655440000');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different user IDs', () => {
      const id1 = UserId.create('550e8400-e29b-41d4-a716-446655440000');
      const id2 = UserId.create('550e8400-e29b-41d4-a716-446655440001');
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('value', () => {
    it('should return the user ID value', () => {
      const id = UserId.create('550e8400-e29b-41d4-a716-446655440000');
      expect(id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });
});
