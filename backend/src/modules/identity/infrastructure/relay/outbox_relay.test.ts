import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';
import { InProcessOutboxRelay, createOutboxRelay } from './outbox_relay';
import type { OutboxRepository } from '../persistence/repositories/outbox_repository';
import type { OutboxPublisher } from '../adapters/outbox_publisher';
import { OutboxRecord } from '../persistence/types/outbox_record';
import type { OutboxRelayConfig } from '../../../../config';
import pino from 'pino';

describe('InProcessOutboxRelay', () => {
  let mockRepository: {
    claimDue: Mock;
    markProcessing: Mock;
    markPublished: Mock;
    markRetry: Mock;
    markFailed: Mock;
    findById: Mock;
  };
  let mockPublisher: {
    publish: Mock;
    connect: Mock;
    disconnect: Mock;
  };
  let config: OutboxRelayConfig;

  const createMockRecord = (overrides?: Partial<OutboxRecord>): OutboxRecord => ({
    id: 'evt-1234-5678',
    eventName: 'UserRegistered',
    eventVersion: 1,
    aggregateType: 'User',
    aggregateId: 'usr-abc-123',
    payload: { email: 'test@example.com' },
    status: 'pending',
    attempts: 0,
    nextAttemptAt: new Date(),
    lastError: null,
    occurredOn: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-15T10:00:00Z'),
    processingStartedAt: null,
    publishedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = {
      claimDue: vi.fn().mockResolvedValue([]),
      markProcessing: vi.fn().mockResolvedValue(undefined),
      markPublished: vi.fn().mockResolvedValue(undefined),
      markRetry: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
    };

    mockPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
    };

    config = {
      pollIntervalMs: 10,
      batchSize: 10,
      maxAttempts: 3,
      backoffBaseMs: 100,
      backoffMaxMs: 1000,
    };
  });

  describe('createOutboxRelay factory', () => {
    it('should create relay with config', () => {
      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );

      expect(relay).toBeInstanceOf(InProcessOutboxRelay);
    });
  });

  describe('start', () => {
    it('should start polling for records when records are available', async () => {
      mockRepository.claimDue.mockResolvedValue([createMockRecord()]);
      mockPublisher.publish.mockResolvedValue(undefined);

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      expect(mockRepository.claimDue).toHaveBeenCalled();
    });

    it('should not start second poll if already running', async () => {
      mockRepository.claimDue.mockResolvedValue([]);

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 30));
      await relay.stop();

      expect(mockRepository.claimDue).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop the relay and disconnect publisher', async () => {
      mockRepository.claimDue.mockResolvedValue([]);

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 30));
      await relay.stop();

      expect(mockPublisher.disconnect).toHaveBeenCalled();
    });

    it('should return immediately if not running', async () => {
      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      await relay.stop();

      expect(mockPublisher.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('publish success', () => {
    it('should mark record as published after successful publish', async () => {
      const record = createMockRecord();
      mockRepository.claimDue.mockResolvedValue([record]);
      mockPublisher.publish.mockResolvedValue(undefined);

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      expect(mockRepository.markPublished).toHaveBeenCalledWith(
        'evt-1234-5678',
        expect.any(Date)
      );
    });
  });

  describe('publish failure with retry', () => {
    it('should schedule retry when publish fails below max attempts', async () => {
      const record = createMockRecord({ attempts: 1 });
      mockRepository.claimDue.mockResolvedValue([record]);
      mockPublisher.publish.mockRejectedValue(new Error('Transient error'));

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      expect(mockRepository.markRetry).toHaveBeenCalledWith(
        'evt-1234-5678',
        2,
        expect.any(Date),
        expect.stringContaining('Transient error')
      );
    });

    it('should calculate exponential backoff correctly', async () => {
      const record = createMockRecord({ attempts: 1 });
      mockRepository.claimDue.mockResolvedValue([record]);
      mockPublisher.publish.mockRejectedValue(new Error('Error'));

      let retryDate: Date | null = null;
      mockRepository.markRetry.mockImplementation((_, __, nextAttemptAt: Date) => {
        retryDate = nextAttemptAt;
        return Promise.resolve();
      });

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      expect(retryDate).toBeInstanceOf(Date);
      expect(retryDate!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should cap backoff at max backoff', async () => {
      const record = createMockRecord({ attempts: 0 });
      mockRepository.claimDue.mockResolvedValue([record]);
      mockPublisher.publish.mockRejectedValue(new Error('Error'));

      let retryDate: Date | null = null;
      mockRepository.markRetry.mockImplementation((_, __, nextAttemptAt: Date) => {
        retryDate = nextAttemptAt;
        return Promise.resolve();
      });

      const configWithSmallMax = { ...config, backoffMaxMs: 50 };
      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        configWithSmallMax
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      expect(retryDate).not.toBeNull();
      expect(retryDate!.getTime()).toBeLessThanOrEqual(Date.now() + 55);
    });
  });

  describe('terminal failure', () => {
    it('should mark record as failed at max attempts', async () => {
      const record = createMockRecord({ attempts: 2 });
      mockRepository.claimDue.mockResolvedValue([record]);
      mockPublisher.publish.mockRejectedValue(new Error('Permanent error'));

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      expect(mockRepository.markFailed).toHaveBeenCalledWith(
        'evt-1234-5678',
        3,
        expect.stringContaining('Permanent error')
      );
    });

    it('should truncate long error messages', async () => {
      const record = createMockRecord({ attempts: 2 });
      mockRepository.claimDue.mockResolvedValue([record]);
      const longError = 'Error'.repeat(300);
      mockPublisher.publish.mockRejectedValue(new Error(longError));

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      const errorArg = mockRepository.markFailed.mock.calls[0][2];
      expect(errorArg.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('logging', () => {
    it('should include eventId in published logs', async () => {
      const logCalls: Array<{ eventId?: string }> = [];
      const mockLogger = {
        info: (obj: unknown) => logCalls.push(obj as { eventId?: string }),
        error: () => {},
        warn: () => {},
        debug: () => {},
        fatal: () => {},
        child: () => mockLogger,
      };
      const record = createMockRecord();
      mockRepository.claimDue.mockResolvedValue([record]);
      mockPublisher.publish.mockResolvedValue(undefined);

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config,
        mockLogger as unknown as pino.Logger
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      const logCall = logCalls.find(
        (call) => call.eventId === 'evt-1234-5678'
      );
      expect(logCall).toBeDefined();
    });

    it('should include eventId in failed logs', async () => {
      const logCalls: Array<{ eventId?: string }> = [];
      const mockLogger = {
        info: () => {},
        error: (obj: unknown) => logCalls.push(obj as { eventId?: string }),
        warn: () => {},
        debug: () => {},
        fatal: () => {},
        child: () => mockLogger,
      };
      const record = createMockRecord({ attempts: 2 });
      mockRepository.claimDue.mockResolvedValue([record]);
      mockPublisher.publish.mockRejectedValue(new Error('Error'));

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config,
        mockLogger as unknown as pino.Logger
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      const logCall = logCalls.find(
        (call) => call.eventId === 'evt-1234-5678'
      );
      expect(logCall).toBeDefined();
    });
  });

  describe('backoff calculation', () => {
    it('should anchor backoff to record nextAttemptAt when in the future', async () => {
      const futureNextAttemptAt = new Date(Date.now() + 10000);
      const record = createMockRecord({ attempts: 0, nextAttemptAt: futureNextAttemptAt });
      mockRepository.claimDue.mockResolvedValue([record]);
      mockPublisher.publish.mockRejectedValue(new Error('Error'));

      let retryDate: Date | null = null;
      mockRepository.markRetry.mockImplementation((_, __, nextAttemptAt: Date) => {
        retryDate = nextAttemptAt;
        return Promise.resolve();
      });

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      expect(retryDate).not.toBeNull();
      expect(retryDate!.getTime()).toBeGreaterThan(futureNextAttemptAt.getTime() - 5);
    });
  });

  describe('redaction', () => {
    it('should redact sensitive data from error messages', async () => {
      const record = createMockRecord({ attempts: 0 });
      mockRepository.claimDue.mockResolvedValue([record]);
      mockPublisher.publish.mockRejectedValue(
        new Error('Failed with password secret123 and token abc')
      );

      const relay = createOutboxRelay(
        mockRepository as unknown as OutboxRepository,
        mockPublisher as unknown as OutboxPublisher,
        config
      );
      relay.start();

      await new Promise((resolve) => setTimeout(resolve, 50));
      await relay.stop();

      const errorArg = mockRepository.markRetry.mock.calls[0][3];
      expect(errorArg).toContain('[REDACTED]');
    });
  });
});