import { DomainEvent } from '../../../../shared/types/domain_event';
import { RefreshTokenId } from '../value_objects/refresh_token_id';
import { UserId } from '../value_objects/user_id';

export interface RefreshTokenCreatedData {
  userId: string;
}

export class RefreshTokenCreatedEvent implements DomainEvent<RefreshTokenCreatedData> {
  readonly eventName = 'RefreshTokenCreated';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly version = 1;
  readonly data: RefreshTokenCreatedData;

  constructor(refreshTokenId: RefreshTokenId, userId: UserId) {
    this.aggregateId = refreshTokenId.value;
    this.data = { userId: userId.value };
    this.occurredOn = new Date();
  }
}
