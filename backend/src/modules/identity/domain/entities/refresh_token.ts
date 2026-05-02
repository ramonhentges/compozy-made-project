import { AggregateRoot } from '../../../../shared/types/aggregate_root';
import { RefreshTokenId } from '../value_objects/refresh_token_id';
import { UserId } from '../value_objects/user_id';
import { RefreshTokenCreatedEvent } from '../events/refresh_token_created';
import { RefreshTokenRevokedEvent } from '../events/refresh_token_revoked';
import { RefreshTokenReusedEvent } from '../events/refresh_token_reused';

export class RefreshToken extends AggregateRoot<RefreshTokenId> {
  public constructor(
    id: RefreshTokenId,
    private readonly _userId: UserId,
    private readonly _tokenHash: string,
    private readonly _expiresAt: Date,
    private readonly _createdAt: Date,
    private _revokedAt: Date | null,
    private readonly _deviceInfo: string | null,
    private _lastUsedAt: Date | null = null
  ) {
    super(id);
  }

  static create(
    id: RefreshTokenId,
    userId: UserId,
    tokenHash: string,
    expiresAt: Date,
    deviceInfo?: string
  ): RefreshToken {
    const now = new Date();
    const refreshToken = new RefreshToken(id, userId, tokenHash, expiresAt, now, null, deviceInfo ?? null, now);
    refreshToken.addDomainEvent(new RefreshTokenCreatedEvent(id, userId));
    return refreshToken;
  }

  get userId(): UserId {
    return this._userId;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get deviceInfo(): string | null {
    return this._deviceInfo;
  }

  get lastUsedAt(): Date | null {
    return this._lastUsedAt;
  }

  touch(): void {
    this._lastUsedAt = new Date();
  }

  revoke(): void {
    if (this._revokedAt !== null) {
      return;
    }
    this._revokedAt = new Date();
    this.addDomainEvent(new RefreshTokenRevokedEvent(this.id));
  }

  markAsReused(): void {
    this.addDomainEvent(new RefreshTokenReusedEvent(this.id, this._userId));
  }

  isExpired(now: Date = new Date()): boolean {
    return this._expiresAt <= now;
  }

  isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  isValid(now: Date = new Date()): boolean {
    return !this.isExpired(now) && !this.isRevoked();
  }
}
