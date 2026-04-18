import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { config, getRequiredEnv, parseDatabaseUrl } from './index';

describe('config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('getRequiredEnv', () => {
    it('should return value when env var exists', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getRequiredEnv('TEST_VAR')).toBe('test-value');
    });

    it('should return fallback when env var not provided but fallback exists', () => {
      delete process.env.TEST_VAR;
      expect(getRequiredEnv('TEST_VAR', 'fallback')).toBe('fallback');
    });

    it('should throw when env var and fallback are missing', () => {
      delete process.env.TEST_VAR;
      expect(() => getRequiredEnv('TEST_VAR')).toThrow('Missing required environment variable: TEST_VAR');
    });
  });

  describe('parseDatabaseUrl', () => {
    it('should parse valid DATABASE_URL', () => {
      const result = parseDatabaseUrl('postgresql://user:pass@localhost:5432/mydb');
      expect(result.host).toBe('localhost');
      expect(result.port).toBe(5432);
      expect(result.database).toBe('mydb');
      expect(result.user).toBe('user');
      expect(result.password).toBe('pass');
    });

    it('should throw on invalid format', () => {
      expect(() => parseDatabaseUrl('invalid-url')).toThrow('Invalid DATABASE_URL format');
    });
  });

  describe('config structure', () => {
    it('should have all required fields when env vars set', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      
      const { config: freshConfig } = await import('./index');
      
      expect(freshConfig.port).toBe(3000);
      expect(freshConfig.database.host).toBe('localhost');
      expect(freshConfig.jwt.secret).toBe('test-secret');
      expect(freshConfig.bcrypt.rounds).toBe(12);
    });

    it('should use PORT env variable', async () => {
      vi.resetModules();
      process.env.PORT = '4000';
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      
      const { config: freshConfig } = await import('./index');
      
      expect(freshConfig.port).toBe(4000);
    });

    it('should use BCRYPT_ROUNDS env variable', async () => {
      vi.resetModules();
      process.env.BCRYPT_ROUNDS = '10';
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      
      const { config: freshConfig } = await import('./index');
      
      expect(freshConfig.bcrypt.rounds).toBe(10);
    });
  });
});