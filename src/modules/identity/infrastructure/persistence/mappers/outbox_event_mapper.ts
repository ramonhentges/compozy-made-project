import { DomainEvent } from '../../../../../shared/types/domain_event';
import { generateUuid } from '../../../../../shared/utils/uuid_generator';
import { OutboxInsertData } from '../types/outbox_record';

const IDENTITY_USER_AGGREGATE_TYPE = 'User';

type SupportedIdentityEventName = 'UserRegistered' | 'PasswordChanged';

type OutboxPayload = { email: string } | null;

export class UnsupportedOutboxEventError extends Error {
  constructor(eventName: string) {
    super(`Unsupported identity outbox event: ${eventName}`);
    this.name = 'UnsupportedOutboxEventError';
  }
}

export class OutboxEventMapper {
  static toInsertData(event: DomainEvent, now: Date = new Date()): OutboxInsertData {
    return {
      id: generateUuid(),
      eventName: event.eventName,
      eventVersion: event.version,
      aggregateType: IDENTITY_USER_AGGREGATE_TYPE,
      aggregateId: event.aggregateId,
      payload: this.toPayload(event),
      status: 'pending',
      attempts: 0,
      nextAttemptAt: now,
      lastError: null,
      occurredOn: event.occurredOn,
      createdAt: now,
      processingStartedAt: null,
      publishedAt: null,
    };
  }

  private static toPayload(event: DomainEvent): OutboxPayload {
    switch (event.eventName as SupportedIdentityEventName) {
      case 'UserRegistered':
        return this.toUserRegisteredPayload(event);
      case 'PasswordChanged':
        return null;
      default:
        throw new UnsupportedOutboxEventError(event.eventName);
    }
  }

  private static toUserRegisteredPayload(event: DomainEvent): { email: string } {
    if (!this.hasEmailData(event.data)) {
      throw new Error('UserRegistered outbox event requires email data');
    }

    return { email: event.data.email };
  }

  private static hasEmailData(data: unknown): data is { email: string } {
    return typeof data === 'object'
      && data !== null
      && 'email' in data
      && typeof data.email === 'string';
  }
}

