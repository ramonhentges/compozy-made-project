import { describe, it, expect } from 'vitest';
import { RefreshToken } from './refresh_token';
import { RefreshTokenId } from '../value_objects/refresh_token_id';
import { UserId } from '../value_objects/user_id';
import { RefreshTokenCreatedEvent } from '../events/refresh_token_created';
import { RefreshTokenRevokedEvent } from '../events/refresh_token_revoked';
import { RefreshTokenReusedEvent } from '../events/refresh_token_reused';

describe('RefreshToken', () => {
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validTokenId = '660e8400-e29b-41d4-a716-446655440001';
  const tokenHash = 'a'.repeat(64);

  describe('create', () => {
    it('should create a refresh token with correct properties', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, expiresAt);

      expect(refreshToken.getId().value).toBe(validTokenId);
      expect(refreshToken.userId.value).toBe(validUserId);
      expect(refreshToken.tokenHash).toBe(tokenHash);
      expect(refreshToken.expiresAt).toBe(expiresAt);
      expect(refreshToken.revokedAt).toBeNull();
      expect(refreshToken.deviceInfo).toBeNull();
      expect(refreshToken.isValid()).toBe(true);
    });

    it('should accept optional deviceInfo', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, expiresAt, 'Chrome on macOS');

      expect(refreshToken.deviceInfo).toBe('Chrome on macOS');
    });

    it('should emit RefreshTokenCreatedEvent on creation', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, expiresAt);
      const events = refreshToken.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(RefreshTokenCreatedEvent);
      expect(events[0].aggregateId).toBe(validTokenId);
      expect(events[0].data).toEqual({ userId: validUserId });
    });
  });

  describe('revoke', () => {
    it('should set revokedAt and emit RefreshTokenRevokedEvent', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, expiresAt);

      refreshToken.pullDomainEvents();
      refreshToken.revoke();

      expect(refreshToken.revokedAt).not.toBeNull();
      expect(refreshToken.isRevoked()).toBe(true);
      expect(refreshToken.isValid()).toBe(false);

      const events = refreshToken.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(RefreshTokenRevokedEvent);
      expect(events[0].aggregateId).toBe(validTokenId);
    });

    it('should not emit event when already revoked', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, expiresAt);

      refreshToken.pullDomainEvents();
      refreshToken.revoke();
      refreshToken.revoke();

      const events = refreshToken.pullDomainEvents();
      expect(events).toHaveLength(1);
    });
  });

  describe('markAsReused', () => {
    it('should emit RefreshTokenReusedEvent without changing state', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, expiresAt);

      refreshToken.pullDomainEvents();
      refreshToken.revoke();
      refreshToken.pullDomainEvents();

      refreshToken.markAsReused();

      const events = refreshToken.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(RefreshTokenReusedEvent);
      expect(events[0].aggregateId).toBe(validTokenId);
      expect(events[0].data).toEqual({ userId: validUserId });
      expect(refreshToken.isRevoked()).toBe(true);
    });
  });

  describe('isExpired', () => {
    it('should return true when past expiration', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const pastDate = new Date(Date.now() - 1000);
      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, pastDate);

      expect(refreshToken.isExpired()).toBe(true);
      expect(refreshToken.isValid()).toBe(false);
    });

    it('should return false when before expiration', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const futureDate = new Date(Date.now() + 1000);
      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, futureDate);

      expect(refreshToken.isExpired()).toBe(false);
      expect(refreshToken.isValid()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('should return false when revoked', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const futureDate = new Date(Date.now() + 1000);
      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, futureDate);

      refreshToken.revoke();

      expect(refreshToken.isValid()).toBe(false);
    });

    it('should return false when expired', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const pastDate = new Date(Date.now() - 1000);
      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, pastDate);

      expect(refreshToken.isValid()).toBe(false);
    });

    it('should return true when not expired and not revoked', () => {
      const userId = UserId.create(validUserId);
      const refreshTokenId = RefreshTokenId.create(validTokenId);
      const futureDate = new Date(Date.now() + 1000);
      const refreshToken = RefreshToken.create(refreshTokenId, userId, tokenHash, futureDate);

      expect(refreshToken.isValid()).toBe(true);
    });
  });
});
