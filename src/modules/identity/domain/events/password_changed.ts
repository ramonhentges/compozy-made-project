import { DomainEvent } from '../../../../shared/types/domain_event';
import { Email } from '../value_objects/email';
import { UserId } from '../value_objects/user_id';

export class PasswordChangedEvent implements DomainEvent {
  readonly eventName = 'PasswordChanged';
  readonly occurredOn: Date;

  constructor(
    public readonly userId: UserId,
    public readonly email: Email
  ) {
    this.occurredOn = new Date();
  }
}
