import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterController } from './register_controller';
import { IRegisterUserUseCase } from '../../../application/register_user/port';
import { DuplicateEmailError, InvalidPasswordError } from '../../../application/register_user/handler';

describe('RegisterController', () => {
  const validEmail = 'test@example.com';
  const validPassword = 'password123';

  let mockRegisterUserUseCase: IRegisterUserUseCase;
  let controller: RegisterController;

  beforeEach(() => {
    mockRegisterUserUseCase = {
      execute: vi.fn(),
    };
    controller = new RegisterController(mockRegisterUserUseCase);
  });

  describe('handle', () => {
    it('should return 201 on successful registration', async () => {
      const mockResult = { userId: 'user-id', email: validEmail };
      mockRegisterUserUseCase.execute = vi.fn().mockResolvedValue(mockResult);

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith(mockResult);
    });

    it('should return 409 on duplicate email', async () => {
      mockRegisterUserUseCase.execute = vi.fn().mockRejectedValue(
        new DuplicateEmailError(validEmail)
      );

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(409);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Email already exists' });
    });

    it('should return 400 on invalid password', async () => {
      mockRegisterUserUseCase.execute = vi.fn().mockRejectedValue(
        new InvalidPasswordError()
      );

      const mockRequest = {
        body: { email: validEmail, password: 'weak' },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'Password does not meet complexity requirements' });
    });

    it('should pass correct command to use case', async () => {
      mockRegisterUserUseCase.execute = vi.fn().mockResolvedValue({
        userId: 'user-id',
        email: validEmail,
      });

      const mockRequest = {
        body: { email: validEmail, password: validPassword },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        email: validEmail,
        password: validPassword,
      });
    });
  });
});
