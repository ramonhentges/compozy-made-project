import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshTokenRepository } from './refresh_token_repository';
import { RefreshToken } from '../../../domain/entities/refresh_token';
import { RefreshTokenId } from '../../../domain/value_objects/refresh_token_id';
import { UserId } from '../../../domain/value_objects/user_id';
import { IDatabase } from 'pg-promise';

describe('RefreshTokenRepository', () => {
  let mockDb: IDatabase<object>;
  let mockTransaction: { none: ReturnType<typeof vi.fn> };
  let refreshTokenRepository: RefreshTokenRepository;

  beforeEach(() => {
    mockTransaction = {
      none: vi.fn().mockResolvedValue(undefined),
    };
    mockDb = {
      oneOrNone: vi.fn(),
      one: vi.fn(),
      manyOrNone: vi.fn(),
      none: vi.fn(),
      tx: vi.fn(async (callback) => callback(mockTransaction)),
    } as unknown as IDatabase<object>;
    refreshTokenRepository = new RefreshTokenRepository(mockDb);
  });

  const createTestRefreshToken = (): RefreshToken => {
    return RefreshToken.create(
      RefreshTokenId.create('660e8400-e29b-41d4-a716-446655440001'),
      UserId.create('550e8400-e29b-41d4-a716-446655440000'),
      'a'.repeat(64),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      'Test Device'
    );
  };

  describe('findById', () => {
    it('should return refresh token when found', async () => {
      const refreshToken = createTestRefreshToken();
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: refreshToken.getId().value,
        user_id: refreshToken.userId.value,
        token_hash: refreshToken.tokenHash,
        expires_at: refreshToken.expiresAt,
        created_at: refreshToken.createdAt,
        revoked_at: refreshToken.revokedAt,
        device_info: refreshToken.deviceInfo,
      });

      const result = await refreshTokenRepository.findById(refreshToken.getId());

      expect(result).not.toBeNull();
      expect(result?.getId().value).toBe(refreshToken.getId().value);
      expect(result?.deviceInfo).toBe('Test Device');
    });

    it('should return null when refresh token not found', async () => {
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await refreshTokenRepository.findById(RefreshTokenId.create('660e8400-e29b-41d4-a716-446655440001'));

      expect(result).toBeNull();
    });
  });

  describe('findByTokenHash', () => {
    it('should return refresh token when found by hash', async () => {
      const refreshToken = createTestRefreshToken();
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: refreshToken.getId().value,
        user_id: refreshToken.userId.value,
        token_hash: refreshToken.tokenHash,
        expires_at: refreshToken.expiresAt,
        created_at: refreshToken.createdAt,
        revoked_at: refreshToken.revokedAt,
        device_info: refreshToken.deviceInfo,
      });

      const result = await refreshTokenRepository.findByTokenHash(refreshToken.tokenHash);

      expect(result).not.toBeNull();
      expect(result?.tokenHash).toBe(refreshToken.tokenHash);
    });

    it('should return null when hash not found', async () => {
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await refreshTokenRepository.findByTokenHash('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findActiveByUserId', () => {
    it('should return active refresh token for user', async () => {
      const refreshToken = createTestRefreshToken();
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: refreshToken.getId().value,
        user_id: refreshToken.userId.value,
        token_hash: refreshToken.tokenHash,
        expires_at: refreshToken.expiresAt,
        created_at: refreshToken.createdAt,
        revoked_at: refreshToken.revokedAt,
        device_info: refreshToken.deviceInfo,
      });

      const result = await refreshTokenRepository.findActiveByUserId(refreshToken.userId);

      expect(result).not.toBeNull();
      expect(result?.userId.value).toBe(refreshToken.userId.value);
    });

    it('should return null when no active token exists', async () => {
      (mockDb.oneOrNone as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await refreshTokenRepository.findActiveByUserId(UserId.create('550e8400-e29b-41d4-a716-446655440000'));

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should start a transaction and insert refresh token plus outbox row', async () => {
      const refreshToken = createTestRefreshToken();

      await refreshTokenRepository.save(refreshToken);

      expect(mockDb.tx).toHaveBeenCalledTimes(1);
      expect(mockTransaction.none).toHaveBeenCalledTimes(2);
      expect(mockTransaction.none).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO refresh_tokens'),
        expect.arrayContaining([
          refreshToken.getId().value,
          refreshToken.userId.value,
          refreshToken.tokenHash,
        ])
      );
      expect(mockTransaction.none).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO events'),
        expect.arrayContaining([
          expect.any(String),
          'RefreshTokenCreated',
          1,
          'RefreshToken',
          refreshToken.getId().value,
          JSON.stringify({ userId: refreshToken.userId.value }),
          'pending',
          0,
        ])
      );
    });

    it('should clear domain events after successful persistence', async () => {
      const refreshToken = createTestRefreshToken();

      await refreshTokenRepository.save(refreshToken);

      expect(refreshToken.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should start a transaction and update refresh token plus outbox row', async () => {
      const refreshToken = createTestRefreshToken();
      refreshToken.pullDomainEvents();
      refreshToken.revoke();

      await refreshTokenRepository.update(refreshToken);

      expect(mockDb.tx).toHaveBeenCalledTimes(1);
      expect(mockTransaction.none).toHaveBeenCalledTimes(2);
      expect(mockTransaction.none).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('UPDATE refresh_tokens'),
        expect.arrayContaining([
          refreshToken.getId().value,
          refreshToken.tokenHash,
        ])
      );
      expect(mockTransaction.none).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO events'),
        expect.arrayContaining([
          expect.any(String),
          'RefreshTokenRevoked',
          1,
          'RefreshToken',
          refreshToken.getId().value,
          JSON.stringify(null),
          'pending',
          0,
        ])
      );
    });

    it('should clear domain events after successful update', async () => {
      const refreshToken = createTestRefreshToken();
      refreshToken.pullDomainEvents();
      refreshToken.revoke();

      await refreshTokenRepository.update(refreshToken);

      expect(refreshToken.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe('revokeAllForUser', () => {
    it('should revoke all tokens for a user', async () => {
      const userId = UserId.create('550e8400-e29b-41d4-a716-446655440000');

      await refreshTokenRepository.revokeAllForUser(userId);

      expect(mockDb.none).toHaveBeenCalledTimes(1);
      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens'),
        [userId.value]
      );
    });
  });

  describe('countActiveByUserId', () => {
    it('should return the count of active tokens for a user', async () => {
      const userId = UserId.create('550e8400-e29b-41d4-a716-446655440000');
      (mockDb.one as ReturnType<typeof vi.fn>).mockResolvedValue({ count: '3' });

      const result = await refreshTokenRepository.countActiveByUserId(userId);

      expect(result).toBe(3);
      expect(mockDb.one).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        [userId.value]
      );
    });
  });

  describe('revokeOldestForUser', () => {
    it('should revoke oldest tokens exceeding the limit', async () => {
      const userId = UserId.create('550e8400-e29b-41d4-a716-446655440000');

      await refreshTokenRepository.revokeOldestForUser(userId, 2);

      expect(mockDb.none).toHaveBeenCalledTimes(1);
      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens'),
        [userId.value, 2]
      );
    });
  });

  describe('deleteAllByUserId', () => {
    it('should delete all tokens for a user', async () => {
      const userId = UserId.create('550e8400-e29b-41d4-a716-446655440000');

      await refreshTokenRepository.deleteAllByUserId(userId);

      expect(mockDb.none).toHaveBeenCalledTimes(1);
      expect(mockDb.none).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM refresh_tokens'),
        [userId.value]
      );
    });
  });
});
