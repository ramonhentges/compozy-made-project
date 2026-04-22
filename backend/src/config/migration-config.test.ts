import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMigrationConfig, getMigrationEnvConfig, getDefaultMigrationConfig } from './migration-config';

describe('migration-config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('getMigrationEnvConfig', () => {
    it('should parse valid context-specific DATABASE_URL', () => {
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/identity_db';
      const result = getMigrationEnvConfig('identity');
      expect(result.database.host).toBe('localhost');
      expect(result.database.port).toBe(5432);
      expect(result.database.database).toBe('identity_db');
      expect(result.database.user).toBe('user');
      expect(result.database.password).toBe('pass');
      expect(result.migrationsDir).toBe('src/migrations/identity');
    });

    it('should throw when context-specific env var is missing', () => {
      delete process.env.IDENTITY_DATABASE_URL;
      expect(() => getMigrationEnvConfig('identity')).toThrow('Missing required environment variable: IDENTITY_DATABASE_URL');
    });

    it('should throw on invalid DATABASE_URL format', () => {
      process.env.IDENTITY_DATABASE_URL = 'invalid-url';
      expect(() => getMigrationEnvConfig('identity')).toThrow('Invalid identity_DATABASE_URL format');
    });
  });

  describe('getDefaultMigrationConfig', () => {
    it('should return default values from DB_* env vars', () => {
      process.env.DB_HOST = 'myhost';
      process.env.DB_PORT = '5433';
      process.env.DB_NAME = 'mydbname';
      process.env.DB_USER = 'myuser';
      process.env.DB_PASSWORD = 'mypass';
      process.env.MIGRATIONS_DIR = 'custom/migrations';

      const result = getDefaultMigrationConfig();

      expect(result.database?.host).toBe('myhost');
      expect(result.database?.port).toBe(5433);
      expect(result.database?.database).toBe('mydbname');
      expect(result.database?.user).toBe('myuser');
      expect(result.database?.password).toBe('mypass');
      expect(result.migrationsDir).toBe('custom/migrations');
    });

    it('should use fallback values when DB_* vars not set', () => {
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;

      const result = getDefaultMigrationConfig();

      expect(result.database?.host).toBe('localhost');
      expect(result.database?.port).toBe(5432);
      expect(result.database?.database).toBe('app');
      expect(result.database?.user).toBe('postgres');
      expect(result.database?.password).toBe('postgres');
      expect(result.migrationsDir).toBe('src/migrations');
    });
  });

  describe('createMigrationConfig', () => {
    it('should use context-specific config when contextName provided', () => {
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/identity_db';
      const result = createMigrationConfig('identity');
      expect(result.database.database).toBe('identity_db');
      expect(result.migrationsDir).toBe('src/migrations/identity');
    });

    it('should parse DATABASE_URL when no context provided and DATABASE_URL set', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      const result = createMigrationConfig();
      expect(result.database.host).toBe('localhost');
      expect(result.database.database).toBe('mydb');
    });

    it('should use DB_* defaults when no DATABASE_URL and no context provided', () => {
      delete process.env.DATABASE_URL;
      process.env.DB_HOST = 'default-host';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'default-db';
      process.env.DB_USER = 'default-user';
      process.env.DB_PASSWORD = 'default-pass';

      const result = createMigrationConfig();

      expect(result.database.host).toBe('default-host');
      expect(result.database.database).toBe('default-db');
    });

    it('should throw when no configuration available', () => {
      delete process.env.DATABASE_URL;
      delete process.env.DB_HOST;
      delete process.env.DB_NAME;
      delete process.env.DB_PORT;

      expect(() => createMigrationConfig()).toThrow('Database configuration not provided');
    });
  });
});

describe('Migration tool instantiation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be able to create config suitable for node-pg-migrate', () => {
    process.env.DATABASE_URL = 'postgresql://testuser:testpass@localhost:5432/testdb';
    const config = createMigrationConfig();

    expect(config.database).toBeDefined();
    expect(config.database.host).toBe('localhost');
    expect(config.database.port).toBe(5432);
    expect(config.database.database).toBe('testdb');
    expect(config.database.user).toBe('testuser');
    expect(config.database.password).toBe('testpass');
    expect(config.migrationsDir).toBeDefined();
  });
});