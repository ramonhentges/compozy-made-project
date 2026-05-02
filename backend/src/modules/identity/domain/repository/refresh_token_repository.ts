import { RefreshToken } from '../entities/refresh_token';
import { RefreshTokenId } from '../value_objects/refresh_token_id';
import { UserId } from '../value_objects/user_id';

export interface IRefreshTokenRepository {
  findById(id: RefreshTokenId): Promise<RefreshToken | null>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  findActiveByUserId(userId: UserId): Promise<RefreshToken | null>;
  findAllActiveByUserId(userId: UserId): Promise<RefreshToken[]>;
  countActiveByUserId(userId: UserId): Promise<number>;
  revokeOldestForUser(userId: UserId, limit: number): Promise<void>;
  save(refreshToken: RefreshToken): Promise<void>;
  update(refreshToken: RefreshToken): Promise<void>;
  updateLastUsedAt(id: RefreshTokenId): Promise<void>;
  revokeAllForUser(userId: UserId): Promise<void>;
  deleteAllByUserId(userId: UserId): Promise<void>;
}
