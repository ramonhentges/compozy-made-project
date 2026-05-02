import { DomainEvent } from '../../../../shared/types/domain_event';
import { RefreshTokenId } from '../value_objects/refresh_token_id';

export class RefreshTokenRevokedEvent implements DomainEvent<null> {
  readonly eventName = 'RefreshTokenRevoked';
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly version = 1;
  readonly data: null = null;

  constructor(refreshTokenId: RefreshTokenId) {
    this.aggregateId = refreshTokenId.value;
    this.occurredOn = new Date();
  }
}
