import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutController } from './logout_controller';
import { ILogoutUserUseCase } from '../../../application/logout_user/port';
import { InvalidRefreshTokenError } from '../../../domain/errors/invalid_refresh_token_error';
import { CookieConfig } from '../utils/cookie_config';

const testCookieConfig: CookieConfig = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  partitioned: true,
};

describe('LogoutController', () => {
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';

  let mockLogoutUserUseCase: ILogoutUserUseCase;
  let controller: LogoutController;

  beforeEach(() => {
    mockLogoutUserUseCase = {
      execute: vi.fn(),
    };
    controller = new LogoutController(mockLogoutUserUseCase, testCookieConfig);
  });

  describe('handle', () => {
    it('should return 200 on successful logout', async () => {
      mockLogoutUserUseCase.execute = vi.fn().mockResolvedValue(undefined);

      const mockRequest = {
        user: { userId: validUserId, email: 'test@example.com' },
        cookies: { refreshToken: 'raw-refresh-token' },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        clearCookie: vi.fn().mockReturnThis(),
        header: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({});
      expect(mockLogoutUserUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: validUserId, tokenHash: expect.any(String) })
      );
      const { maxAge: _maxAge, ...expectedClearConfig } = testCookieConfig;
      expect(mockReply.clearCookie).toHaveBeenCalledWith('refreshToken', expectedClearConfig);
      expect(mockReply.header).toHaveBeenCalledWith('Clear-Site-Data', '"cookies", "storage"');
    });

    it('should return 200 and clear cookie even when token is already invalid', async () => {
      mockLogoutUserUseCase.execute = vi.fn().mockRejectedValue(new InvalidRefreshTokenError());

      const mockRequest = {
        user: { userId: validUserId, email: 'test@example.com' },
        cookies: { refreshToken: 'raw-refresh-token' },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        clearCookie: vi.fn().mockReturnThis(),
        header: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({});
      expect(mockReply.clearCookie).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequest = {
        user: undefined,
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockLogoutUserUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 401 when user object is missing userId', async () => {
      const mockRequest = {
        user: {},
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockLogoutUserUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 401 when refresh token cookie is missing', async () => {
      const mockRequest = {
        user: { userId: validUserId, email: 'test@example.com' },
        cookies: {},
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockLogoutUserUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
