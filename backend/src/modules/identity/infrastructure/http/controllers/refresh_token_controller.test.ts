import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshTokenController } from './refresh_token_controller';
import { IRefreshTokenUseCase } from '../../../application/refresh_token/port';
import { CookieConfig } from '../utils/cookie_config';

const testCookieConfig: CookieConfig = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  partitioned: true,
};

describe('RefreshTokenController', () => {
  let mockRefreshTokenUseCase: IRefreshTokenUseCase;
  let controller: RefreshTokenController;

  beforeEach(() => {
    mockRefreshTokenUseCase = {
      execute: vi.fn(),
    };
    controller = new RefreshTokenController(mockRefreshTokenUseCase, testCookieConfig);
  });

  describe('handle', () => {
    it('should return 200 with new access token and user on valid refresh token', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: 'user-id', email: 'test@example.com', name: 'John Doe' },
      };
      mockRefreshTokenUseCase.execute = vi.fn().mockResolvedValue(mockResult);

      const mockRequest = {
        cookies: { refreshToken: 'valid-refresh-token' },
        headers: {},
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        setCookie: vi.fn().mockReturnThis(),
        clearCookie: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith({ refreshToken: 'valid-refresh-token', deviceInfo: undefined });
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        accessToken: 'new-access-token',
        user: { id: 'user-id', email: 'test@example.com', name: 'John Doe' },
      });
      expect(mockReply.setCookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', testCookieConfig);
    });

    it('should pass device info from user-agent header to use case', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: 'user-id', email: 'test@example.com', name: 'John Doe' },
      };
      mockRefreshTokenUseCase.execute = vi.fn().mockResolvedValue(mockResult);

      const mockRequest = {
        cookies: { refreshToken: 'valid-refresh-token' },
        headers: { 'user-agent': 'Mozilla/5.0' },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        setCookie: vi.fn().mockReturnThis(),
        clearCookie: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith({ refreshToken: 'valid-refresh-token', deviceInfo: 'Mozilla/5.0' });
    });

    it('should return 401 when refresh token cookie is missing', async () => {
      const mockRequest = {
        cookies: {},
        headers: {},
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        setCookie: vi.fn().mockReturnThis(),
        clearCookie: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockRefreshTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 401 when refresh token is invalid', async () => {
      mockRefreshTokenUseCase.execute = vi.fn().mockRejectedValue(new Error('Invalid token'));

      const mockRequest = {
        cookies: { refreshToken: 'invalid-refresh-token' },
        headers: {},
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        setCookie: vi.fn().mockReturnThis(),
        clearCookie: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
      const { maxAge: _maxAge, ...expectedClearConfig } = testCookieConfig;
      expect(mockReply.clearCookie).toHaveBeenCalledWith('refreshToken', expectedClearConfig);
    });
  });
});
