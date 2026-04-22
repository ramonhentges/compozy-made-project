import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRequiredEnv, parseDatabaseUrl } from './index';

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

  describe('kafka config', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
      vi.resetModules();
    });

    it('should have default Kafka brokers', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.kafka.brokers).toEqual(['localhost:9092']);
    });

    it('should parse KAFKA_BROKERS as comma-separated list', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      process.env.KAFKA_BROKERS = 'broker1:9092, broker2:9092 , broker3:9092';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.kafka.brokers).toEqual(['broker1:9092', 'broker2:9092', 'broker3:9092']);
    });

    it('should use default Kafka client ID', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.kafka.clientId).toBe('identity-service');
    });

    it('should use KAFKA_CLIENT_ID env variable', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      process.env.KAFKA_CLIENT_ID = 'custom-client-id';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.kafka.clientId).toBe('custom-client-id');
    });

    it('should use default identity outbox topic', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.kafka.identityOutboxTopic).toBe('identity-outbox');
    });

    it('should use IDENTITY_OUTBOX_TOPIC env variable', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      process.env.IDENTITY_OUTBOX_TOPIC = 'custom-topic';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.kafka.identityOutboxTopic).toBe('custom-topic');
    });
  });

  describe('outbox relay config', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
      vi.resetModules();
    });

    it('should have default relay poll interval', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.pollIntervalMs).toBe(1000);
    });

    it('should use OUTBOX_RELAY_POLL_INTERVAL_MS env variable', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      process.env.OUTBOX_RELAY_POLL_INTERVAL_MS = '2000';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.pollIntervalMs).toBe(2000);
    });

    it('should have default relay batch size', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.batchSize).toBe(100);
    });

    it('should use OUTBOX_RELAY_BATCH_SIZE env variable', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      process.env.OUTBOX_RELAY_BATCH_SIZE = '50';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.batchSize).toBe(50);
    });

    it('should have default relay max attempts', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.maxAttempts).toBe(5);
    });

    it('should use OUTBOX_RELAY_MAX_ATTEMPTS env variable', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      process.env.OUTBOX_RELAY_MAX_ATTEMPTS = '10';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.maxAttempts).toBe(10);
    });

    it('should have default relay backoff base', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.backoffBaseMs).toBe(1000);
    });

    it('should use OUTBOX_RELAY_BACKOFF_BASE_MS env variable', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      process.env.OUTBOX_RELAY_BACKOFF_BASE_MS = '500';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.backoffBaseMs).toBe(500);
    });

    it('should have default relay backoff max', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.backoffMaxMs).toBe(60000);
    });

    it('should use OUTBOX_RELAY_BACKOFF_MAX_MS env variable', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      process.env.OUTBOX_RELAY_BACKOFF_MAX_MS = '300000';

      const { config: freshConfig } = await import('./index');

      expect(freshConfig.outboxRelay.backoffMaxMs).toBe(300000);
    });
  });

  describe('config structure', () => {
    it('should have all required fields when env vars set', async () => {
      vi.resetModules();
      process.env.JWT_SECRET = 'test-secret';
      process.env.IDENTITY_DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
      
      const { config: freshConfig } = await import('./index');
      
      expect(freshConfig.port).toBe(3000);
      expect(freshConfig.identityDatabase.host).toBe('localhost');
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