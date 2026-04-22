import { describe, it, expect, beforeEach } from 'vitest';
import { BcryptAdapter } from './bcrypt_adapter';

describe('BcryptAdapter', () => {
  let passwordHasher: BcryptAdapter;

  beforeEach(() => {
    passwordHasher = new BcryptAdapter();
  });

  describe('hash', () => {
    it('should hash a password and return a bcrypt hash', async () => {
      const password = 'testPassword123';
      const hash = await passwordHasher.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await passwordHasher.hash(password);
      const hash2 = await passwordHasher.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verify', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await passwordHasher.hash(password);

      const isValid = await passwordHasher.verify(password, hash);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await passwordHasher.hash(password);

      const isValid = await passwordHasher.verify(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });
});
