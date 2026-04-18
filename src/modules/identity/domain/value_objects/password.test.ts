import { describe, it, expect } from 'vitest';
import { Password, InvalidPasswordError } from './password';

describe('Password', () => {
  describe('constructor', () => {
    it('should accept valid hash via public constructor', () => {
      const hash = '$2b$12$hashedpassword1234567890123456789012';
      const password = new Password(hash);

      expect(password.hash).toBe(hash);
    });
  });

  describe('create', () => {
    it('should create password with valid hash', () => {
      const hash = '$2b$12$hashedpassword1234567890123456789012';
      const password = Password.create(hash);

      expect(password.hash).toBe(hash);
    });

    it('should throw InvalidPasswordError on empty string', () => {
      expect(() => Password.create('')).toThrow(InvalidPasswordError);
    });

    it('should throw InvalidPasswordError on null/undefined', () => {
      expect(() => Password.create(null as any)).toThrow(InvalidPasswordError);
      expect(() => Password.create(undefined as any)).toThrow(InvalidPasswordError);
    });
  });

  describe('equals', () => {
    it('should return true for same hash', () => {
      const hash = '$2b$12$hashedpassword1234567890123456789012';
      const password1 = new Password(hash);
      const password2 = new Password(hash);

      expect(password1.equals(password2)).toBe(true);
    });

    it('should return false for different hash', () => {
      const password1 = new Password('$2b$12$hash1');
      const password2 = new Password('$2b$12$hash2');

      expect(password1.equals(password2)).toBe(false);
    });
  });

  describe('hash getter', () => {
    it('should return the hash value', () => {
      const hash = '$2b$12$hashedpassword1234567890123456789012';
      const password = new Password(hash);

      expect(password.hash).toBe(hash);
    });
  });
});