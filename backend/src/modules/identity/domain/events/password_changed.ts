import { DomainEvent } from '../../../../shared/types/domain_event';
import { UserId } from '../value_objects/user_id';

export type PasswordChangedData = null;

export class PasswordChangedEvent implements DomainEvent<PasswordChangedData> {
  readonly eventName = 'PasswordChanged';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly version = 1;
  readonly data: PasswordChangedData;

  constructor(userId: UserId) {
    this.aggregateId = userId.value;
    this.data = null;
    this.occurredOn = new Date();
  }
}