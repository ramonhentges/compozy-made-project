import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getIdentityDatabaseConfig, identityDbConfig, IdentityDatabaseConfig } from './identity_context';

describe('identity_context config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('getIdentityDatabaseConfig', () => {
    it('should parse IDENTITY_DATABASE_URL', () => {
      process.env.IDENTITY_DATABASE_URL = 'postgresql://identity_user:identity_pass@localhost:5432/identity_db';
      
      const config = getIdentityDatabaseConfig();
      
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('identity_db');
      expect(config.user).toBe('identity_user');
      expect(config.password).toBe('identity_pass');
    });

    it('should throw on invalid IDENTITY_DATABASE_URL format', () => {
      process.env.IDENTITY_DATABASE_URL = 'invalid-url';
      
      expect(() => getIdentityDatabaseConfig()).toThrow('Invalid DATABASE_URL format');
    });

    it('should use IDENTITY_DB_* env vars as fallback', () => {
      delete process.env.IDENTITY_DATABASE_URL;
      process.env.IDENTITY_DB_HOST = '192.168.1.1';
      process.env.IDENTITY_DB_PORT = '5433';
      process.env.IDENTITY_DB_NAME = 'custom_identity_db';
      process.env.IDENTITY_DB_USER = 'custom_user';
      process.env.IDENTITY_DB_PASSWORD = 'custom_pass';
      
      const config = getIdentityDatabaseConfig();
      
      expect(config.host).toBe('192.168.1.1');
      expect(config.port).toBe(5433);
      expect(config.database).toBe('custom_identity_db');
      expect(config.user).toBe('custom_user');
      expect(config.password).toBe('custom_pass');
    });

    it('should use sensible defaults for development', () => {
      delete process.env.IDENTITY_DATABASE_URL;
      delete process.env.IDENTITY_DB_HOST;
      delete process.env.IDENTITY_DB_NAME;
      
      const config = getIdentityDatabaseConfig();
      
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('identity_db');
    });

    it('should use IDENTITY_MAX_CONNECTIONS if provided', () => {
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.IDENTITY_MAX_CONNECTIONS = '50';
      
      const config = getIdentityDatabaseConfig();
      
      expect(config.maxConnections).toBe(50);
    });

    it('should default maxConnections to 20', () => {
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      delete process.env.IDENTITY_MAX_CONNECTIONS;
      
      const config = getIdentityDatabaseConfig();
      
      expect(config.maxConnections).toBe(20);
    });

    it('is properly isolated from other contexts', () => {
      process.env.DATABASE_URL = 'postgresql://app_user:app_pass@localhost:5432/app_db';
      
      const config = getIdentityDatabaseConfig();
      
      expect(config.database).toBe('identity_db');
    });
  });

  describe('identityDbConfig singleton', () => {
    it('should be defined', () => {
      expect(identityDbConfig).toBeDefined();
    });

    it('should have all required fields', () => {
      expect(identityDbConfig.host).toBeDefined();
      expect(identityDbConfig.port).toBeDefined();
      expect(identityDbConfig.database).toBeDefined();
      expect(identityDbConfig.user).toBeDefined();
      expect(identityDbConfig.password).toBeDefined();
    });
  });
});