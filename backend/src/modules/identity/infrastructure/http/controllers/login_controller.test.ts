import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginController } from './login_controller';
import { ILoginUserUseCase } from '../../../application/login_user/port';
import { InvalidCredentialsError } from '../../../domain/errors/invalid_credentials_error';
import { CookieConfig } from '../utils/cookie_config';

const testCookieConfig: CookieConfig = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  partitioned: true,
};

describe('LoginController', () => {
  const validEmail = 'test@example.com';
  const validPassword = 'password123';

  let mockLoginUserUseCase: ILoginUserUseCase;
  let controller: LoginController;

  beforeEach(() => {
    mockLoginUserUseCase = {
      execute: vi.fn(),
    };
    controller = new LoginController(mockLoginUserUseCase, testCookieConfig);
  });

  describe('handle', () => {
    it('should return 200 on successful login', async () => {
      const mockResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-id', email: validEmail, name: 'John Doe' },
      };
      mockLoginUserUseCase.execute = vi.fn().mockResolvedValue(mockResult);

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
        headers: {},
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        setCookie: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        accessToken: 'access-token',
        user: { id: 'user-id', email: validEmail, name: 'John Doe' },
      });
      expect(mockReply.setCookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', testCookieConfig);
    });

    it('should return 401 on invalid credentials', async () => {
      mockLoginUserUseCase.execute = vi.fn().mockRejectedValue(
        new InvalidCredentialsError()
      );

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
        headers: {},
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        setCookie: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should pass correct command to use case', async () => {
      mockLoginUserUseCase.execute = vi.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-id', email: validEmail, name: 'John Doe' },
      });

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
        headers: {},
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        setCookie: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
        deviceInfo: undefined,
      });
    });

    it('should pass device info from user-agent header to use case', async () => {
      mockLoginUserUseCase.execute = vi.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-id', email: validEmail, name: 'John Doe' },
      });

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
        headers: { 'user-agent': 'Mozilla/5.0' },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
        setCookie: vi.fn().mockReturnThis(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
        deviceInfo: 'Mozilla/5.0',
      });
    });
  });
});
