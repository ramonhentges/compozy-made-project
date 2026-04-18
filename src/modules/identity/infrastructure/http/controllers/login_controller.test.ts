import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginController } from './login_controller';
import { ILoginUserUseCase } from '../../../application/login_user/port';
import { InvalidCredentialsError } from '../../../domain/errors/invalid_credentials_error';

describe('LoginController', () => {
  const validEmail = 'test@example.com';
  const validPassword = 'password123';

  let mockLoginUserUseCase: ILoginUserUseCase;
  let controller: LoginController;

  beforeEach(() => {
    mockLoginUserUseCase = {
      execute: vi.fn(),
    };
    controller = new LoginController(mockLoginUserUseCase);
  });

  describe('handle', () => {
    it('should return 200 on successful login', async () => {
      const mockResult = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      mockLoginUserUseCase.execute = vi.fn().mockResolvedValue(mockResult);

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockResult);
    });

    it('should return 401 on invalid credentials', async () => {
      mockLoginUserUseCase.execute = vi.fn().mockRejectedValue(
        new InvalidCredentialsError()
      );

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should pass correct command to use case', async () => {
      mockLoginUserUseCase.execute = vi.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
      });
    });
  });
});
