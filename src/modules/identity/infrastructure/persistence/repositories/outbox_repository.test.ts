import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PgOutboxRepository } from './outbox_repository';
import type { IDatabase, ITask } from 'pg-promise';
import { OutboxRecord } from '../types/outbox_record';

describe('PgOutboxRepository', () => {
  let mockDb: {
    many: Mock;
    none: Mock;
    oneOrNone: Mock;
  };
  let repository: PgOutboxRepository;

  const mockRecord = {
    id: 'evt-123',
    event_name: 'UserRegistered',
    event_version: 1,
    aggregate_type: 'User',
    aggregate_id: 'usr-123',
    payload: { email: 'test@example.com' },
    status: 'pending' as const,
    attempts: 0,
    next_attempt_at: new Date(),
    last_error: null,
    occurred_on: new Date(),
    created_at: new Date(),
    processing_started_at: null,
    published_at: null,
  };

  beforeEach(() => {
    mockDb = {
      many: vi.fn(),
      none: vi.fn(),
      oneOrNone: vi.fn(),
    };
    repository = new PgOutboxRepository(mockDb as unknown as IDatabase<object>);
  });

  describe('claimDue', () => {
    it('should claim due records within limit', async () => {
      mockDb.many.mockResolvedValue([mockRecord]);

      const now = new Date();
      const records = await repository.claimDue(10, now);

      expect(mockDb.many).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [now, 10]
      );
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe('evt-123');
    });

    it('should return empty array when no records due', async () => {
      mockDb.many.mockResolvedValue([]);

      const now = new Date();
      const records = await repository.claimDue(10, now);

      expect(records).toHaveLength(0);
    });

    it('should not update status if no records returned', async () => {
      mockDb.many.mockResolvedValue([]);

      const now = new Date();
      await repository.claimDue(10, now);

      expect(mockDb.none).not.toHaveBeenCalled();
    });
  });

  describe('markProcessing', () => {
    it('should update status to processing', async () => {
      mockDb.none.mockResolvedValue(undefined);

      await repository.markProcessing('evt-123', new Date());

      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE events'),
        ['evt-123', expect.any(Date)]
      );
    });
  });

  describe('markPublished', () => {
    it('should update status to published with timestamp', async () => {
      mockDb.none.mockResolvedValue(undefined);
      const publishedAt = new Date();

      await repository.markPublished('evt-123', publishedAt);

      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE events'),
        ['evt-123', publishedAt]
      );
    });
  });

  describe('markRetry', () => {
    it('should reschedule with incremented attempts', async () => {
      mockDb.none.mockResolvedValue(undefined);
      const nextAttempt = new Date();

      await repository.markRetry('evt-123', 2, nextAttempt, 'Some error');

      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE events'),
        ['evt-123', 2, nextAttempt, 'Some error']
      );
    });
  });

  describe('markFailed', () => {
    it('should mark record as failed with final error', async () => {
      mockDb.none.mockResolvedValue(undefined);

      await repository.markFailed('evt-123', 5, 'Final error');

      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE events'),
        ['evt-123', 5, 'Final error']
      );
    });
  });

  describe('findById', () => {
    it('should return record when found', async () => {
      mockDb.oneOrNone.mockResolvedValue(mockRecord);

      const result = await repository.findById('evt-123');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('evt-123');
    });

    it('should return null when not found', async () => {
      mockDb.oneOrNone.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});