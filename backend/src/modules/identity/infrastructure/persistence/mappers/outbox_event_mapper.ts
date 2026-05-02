import { DomainEvent } from '../../../../../shared/types/domain_event';
import { generateUuid } from '../../../../../shared/utils/uuid_generator';
import { OutboxInsertData } from '../types/outbox_record';

type SupportedIdentityEventName = 'UserRegistered' | 'PasswordChanged' | 'RefreshTokenCreated' | 'RefreshTokenRevoked';

type OutboxPayload = { email: string } | { userId: string } | null;

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
      aggregateType: this.toAggregateType(event.eventName as SupportedIdentityEventName),
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

  private static toAggregateType(eventName: SupportedIdentityEventName): string {
    switch (eventName) {
      case 'UserRegistered':
      case 'PasswordChanged':
        return 'User';
      case 'RefreshTokenCreated':
      case 'RefreshTokenRevoked':
        return 'RefreshToken';
      default:
        throw new UnsupportedOutboxEventError(eventName);
    }
  }

  private static toPayload(event: DomainEvent): OutboxPayload {
    switch (event.eventName as SupportedIdentityEventName) {
      case 'UserRegistered':
        return this.toUserRegisteredPayload(event);
      case 'PasswordChanged':
        return null;
      case 'RefreshTokenCreated':
        return this.toRefreshTokenCreatedPayload(event);
      case 'RefreshTokenRevoked':
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

  private static toRefreshTokenCreatedPayload(event: DomainEvent): { userId: string } {
    if (!this.hasUserIdData(event.data)) {
      throw new Error('RefreshTokenCreated outbox event requires userId data');
    }

    return { userId: event.data.userId };
  }

  private static hasEmailData(data: unknown): data is { email: string } {
    return typeof data === 'object'
      && data !== null
      && 'email' in data
      && typeof data.email === 'string';
  }

  private static hasUserIdData(data: unknown): data is { userId: string } {
    return typeof data === 'object'
      && data !== null
      && 'userId' in data
      && typeof data.userId === 'string';
  }
}
