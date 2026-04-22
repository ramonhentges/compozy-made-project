import { DomainEvent } from '../../../../shared/types/domain_event';
import { Email } from '../value_objects/email';
import { UserId } from '../value_objects/user_id';

export interface UserRegisteredData {
  email: string;
}

export class UserRegisteredEvent implements DomainEvent<UserRegisteredData> {
  readonly eventName = 'UserRegistered';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly version = 1;
  readonly data: UserRegisteredData;

  constructor(userId: UserId, email: Email) {
    this.aggregateId = userId.value;
    this.data = { email: email.value };
    this.occurredOn = new Date();
  }
}