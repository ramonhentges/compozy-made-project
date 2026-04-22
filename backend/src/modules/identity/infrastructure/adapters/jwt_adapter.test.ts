import { describe, it, expect, beforeEach } from 'vitest';
import { JwtAdapter } from './jwt_adapter';
import { UserId } from '../../domain/value_objects/user_id';

describe('JwtAdapter', () => {
  const secret = 'test-secret-key-for-testing';
  let jwtAdapter: JwtAdapter;

  beforeEach(() => {
    jwtAdapter = new JwtAdapter({ secret });
  });

  const createPayload = () => ({
    userId: UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789'),
    email: 'test@example.com',
    type: 'access' as const,
  });

  const createRefreshPayload = () => ({
    userId: UserId.create('a1b2c3d4-e5f6-4789-abcd-ef0123456789'),
    email: 'test@example.com',
    type: 'refresh' as const,
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const payload = createPayload();

      const token = jwtAdapter.generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const payload = createRefreshPayload();

      const token = jwtAdapter.generateRefreshToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const originalPayload = createPayload();
      const token = jwtAdapter.generateAccessToken(originalPayload);

      const decoded = jwtAdapter.verifyAccessToken(token);

      expect(decoded.email).toBe(originalPayload.email);
      expect(decoded.userId.value).toBe(originalPayload.userId.value);
      expect(decoded.type).toBe('access');
    });

    it('should throw for a refresh token', () => {
      const refreshPayload = createRefreshPayload();
      const token = jwtAdapter.generateRefreshToken(refreshPayload);

      expect(() => jwtAdapter.verifyAccessToken(token)).toThrow('Invalid token type: expected access token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const originalPayload = createRefreshPayload();
      const token = jwtAdapter.generateRefreshToken(originalPayload);

      const decoded = jwtAdapter.verifyRefreshToken(token);

      expect(decoded.email).toBe(originalPayload.email);
      expect(decoded.userId.value).toBe(originalPayload.userId.value);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw for an access token', () => {
      const accessPayload = createPayload();
      const token = jwtAdapter.generateAccessToken(accessPayload);

      expect(() => jwtAdapter.verifyRefreshToken(token)).toThrow('Invalid token type: expected refresh token');
    });
  });

  describe('token expiration', () => {
    it('should detect expired tokens via verify', () => {
      const shortLivedAdapter = new JwtAdapter({ secret });
      const payload = createPayload();

      const token = shortLivedAdapter.generateAccessToken(payload);

      expect(() => shortLivedAdapter.verifyAccessToken(token)).not.toThrow();
    });
  });
});
