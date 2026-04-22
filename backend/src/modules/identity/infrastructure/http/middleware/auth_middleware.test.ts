import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthMiddleware, AuthenticatedUser } from './auth_middleware';
import { ITokenService, TokenPayload } from '../../../domain/services/token_service';
import { UserId } from '../../../domain/value_objects/user_id';

describe('AuthMiddleware', () => {
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validEmail = 'test@example.com';
  const validToken = 'valid-token';

  let mockTokenService: ITokenService;
  let middleware: ReturnType<typeof createAuthMiddleware>;

  beforeEach(() => {
    mockTokenService = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    };
    middleware = createAuthMiddleware(mockTokenService);
  });

  describe('when authorization header is missing', () => {
    it('should return 401', async () => {
      const mockRequest = {
        headers: {},
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await middleware(mockRequest, mockReply, vi.fn() as any);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('when authorization header format is invalid', () => {
    it('should return 401 when no Bearer prefix', async () => {
      const mockRequest = {
        headers: { authorization: 'Basic sometoken' },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await middleware(mockRequest, mockReply, vi.fn() as any);

      expect(mockReply.status).toHaveBeenCalledWith(401);
    });
  });

  describe('when token is invalid', () => {
    it('should return 401', async () => {
      mockTokenService.verifyAccessToken = vi.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const mockRequest = {
        headers: { authorization: `Bearer ${validToken}` },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await middleware(mockRequest, mockReply, vi.fn() as any);

      expect(mockReply.status).toHaveBeenCalledWith(401);
    });
  });

  describe('when token is valid', () => {
    it('should set user on request', async () => {
      const payload: TokenPayload = {
        userId: UserId.create(validUserId),
        email: validEmail,
        type: 'access',
      };
      mockTokenService.verifyAccessToken = vi.fn().mockReturnValue(payload);

      const mockRequest = {
        headers: { authorization: `Bearer ${validToken}` },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await middleware(mockRequest, mockReply, vi.fn() as any);

      expect(mockRequest.user).toEqual({
        userId: validUserId,
        email: validEmail,
      });
      expect(mockReply.status).not.toHaveBeenCalled();
    });
  });
});
