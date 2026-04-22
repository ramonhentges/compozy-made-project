import { describe, expect, it } from 'vitest';
import { UserRegisteredEvent } from '../../../domain/events/user_registered';
import { PasswordChangedEvent } from '../../../domain/events/password_changed';
import { Email } from '../../../domain/value_objects/email';
import { UserId } from '../../../domain/value_objects/user_id';
import { DomainEvent } from '../../../../../shared/types/domain_event';
import {
  INSERT_OUTBOX_EVENT_SQL,
  OUTBOX_INSERT_COLUMNS,
  toOutboxInsertParams,
} from '../sql/outbox_sql';
import { OutboxEventMapper } from './outbox_event_mapper';

describe('OutboxEventMapper', () => {
  const userId = UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789');
  const scheduledAt = new Date('2026-04-21T10:00:00.000Z');

  it('maps UserRegistered to a minimized outbox insert record', () => {
    const event = new UserRegisteredEvent(userId, Email.create('test@example.com'));

    const record = OutboxEventMapper.toInsertData(event, scheduledAt);

    expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(record.eventName).toBe('UserRegistered');
    expect(record.eventVersion).toBe(1);
    expect(record.aggregateType).toBe('User');
    expect(record.aggregateId).toBe(userId.value);
    expect(record.occurredOn).toBe(event.occurredOn);
    expect(record.payload).toEqual({ email: 'test@example.com' });
  });

  it('maps PasswordChanged to a null payload outbox insert record', () => {
    const event = new PasswordChangedEvent(userId);

    const record = OutboxEventMapper.toInsertData(event, scheduledAt);

    expect(record.eventName).toBe('PasswordChanged');
    expect(record.eventVersion).toBe(1);
    expect(record.aggregateType).toBe('User');
    expect(record.aggregateId).toBe(userId.value);
    expect(record.occurredOn).toBe(event.occurredOn);
    expect(record.payload).toBeNull();
  });

  it('includes pending status and retry scheduling fields expected by the migration', () => {
    const event = new UserRegisteredEvent(userId, Email.create('test@example.com'));

    const record = OutboxEventMapper.toInsertData(event, scheduledAt);

    expect(record.status).toBe('pending');
    expect(record.attempts).toBe(0);
    expect(record.nextAttemptAt).toBe(scheduledAt);
    expect(record.lastError).toBeNull();
    expect(record.createdAt).toBe(scheduledAt);
    expect(record.processingStartedAt).toBeNull();
    expect(record.publishedAt).toBeNull();
  });

  it('does not introduce sensitive fields into mapped payloads', () => {
    const event = new UserRegisteredEvent(userId, Email.create('test@example.com'));
    const record = OutboxEventMapper.toInsertData(event, scheduledAt);

    expect(JSON.stringify(record)).not.toContain('password');
    expect(JSON.stringify(record)).not.toContain('password_hash');
    expect(JSON.stringify(record)).not.toContain('hashedPassword');
    expect(JSON.stringify(record)).not.toContain('token');
    expect(JSON.stringify(record)).not.toContain('request');
    expect(Object.keys(record.payload as Record<string, unknown>)).toEqual(['email']);
  });

  it('drops sensitive fields from event-like UserRegistered data', () => {
    const event: DomainEvent = {
      eventName: 'UserRegistered',
      version: 1,
      aggregateId: userId.value,
      occurredOn: new Date('2026-04-21T09:00:00.000Z'),
      data: {
        email: 'test@example.com',
        passwordHash: 'hashedPassword123',
        token: 'jwt-token',
        requestMetadata: { ip: '127.0.0.1' },
      },
    };

    const record = OutboxEventMapper.toInsertData(event, scheduledAt);

    expect(record.payload).toEqual({ email: 'test@example.com' });
    expect(JSON.stringify(record.payload)).not.toContain('passwordHash');
    expect(JSON.stringify(record.payload)).not.toContain('token');
    expect(JSON.stringify(record.payload)).not.toContain('requestMetadata');
  });
});

describe('outbox SQL helper', () => {
  it('orders insert parameters to match the outbox migration columns', () => {
    const event = new UserRegisteredEvent(
      UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789'),
      Email.create('test@example.com')
    );
    const scheduledAt = new Date('2026-04-21T10:00:00.000Z');
    const record = OutboxEventMapper.toInsertData(event, scheduledAt);

    const params = toOutboxInsertParams(record);

    expect(OUTBOX_INSERT_COLUMNS).toEqual([
      'id',
      'event_name',
      'event_version',
      'aggregate_type',
      'aggregate_id',
      'payload',
      'status',
      'attempts',
      'next_attempt_at',
      'last_error',
      'occurred_on',
      'created_at',
      'processing_started_at',
      'published_at',
    ]);
    expect(params).toEqual([
      record.id,
      record.eventName,
      record.eventVersion,
      record.aggregateType,
      record.aggregateId,
      JSON.stringify(record.payload),
      record.status,
      record.attempts,
      record.nextAttemptAt,
      record.lastError,
      record.occurredOn,
      record.createdAt,
      record.processingStartedAt,
      record.publishedAt,
    ]);
    expect(INSERT_OUTBOX_EVENT_SQL).toContain('$6::jsonb');
  });

  it('serializes PasswordChanged payload as JSON null for the jsonb NOT NULL column', () => {
    const event = new PasswordChangedEvent(
      UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789')
    );
    const record = OutboxEventMapper.toInsertData(event, new Date('2026-04-21T10:00:00.000Z'));

    const params = toOutboxInsertParams(record);

    expect(params[5]).toBe('null');
  });
});
