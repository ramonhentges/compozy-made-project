import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutController } from './logout_controller';
import { ILogoutUserUseCase } from '../../../application/logout_user/port';

describe('LogoutController', () => {
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';

  let mockLogoutUserUseCase: ILogoutUserUseCase;
  let controller: LogoutController;

  beforeEach(() => {
    mockLogoutUserUseCase = {
      execute: vi.fn(),
    };
    controller = new LogoutController(mockLogoutUserUseCase);
  });

  describe('handle', () => {
    it('should return 200 on successful logout', async () => {
      mockLogoutUserUseCase.execute = vi.fn().mockResolvedValue(undefined);

      const mockRequest = {
        user: { userId: validUserId, email: 'test@example.com' },
      } as any;
      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      } as any;

      await controller.handle(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({});
      expect(mockLogoutUserUseCase.execute).toHaveBeenCalledWith(validUserId);
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
      expect(mockLogoutUserUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
