import { describe, it, expect, vi } from 'vitest';
import { ListSessionsController } from './list_sessions_controller';
import { IListSessionsUseCase } from '../../../application/list_sessions/port';

function createMockRequest(userId?: string, cookieToken?: string) {
  return {
    user: userId ? { userId } : undefined,
    cookies: cookieToken ? { refreshToken: cookieToken } : {},
  } as unknown as Parameters<ListSessionsController['handle']>[0];
}

function createMockReply() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Parameters<ListSessionsController['handle']>[1];
}

describe('ListSessionsController', () => {
  it('should return 401 when user is not authenticated', async () => {
    const mockUseCase: IListSessionsUseCase = {
      execute: vi.fn(),
    };
    const controller = new ListSessionsController(mockUseCase);
    const request = createMockRequest();
    const reply = createMockReply();

    await controller.handle(request, reply);

    expect((reply as any).status).toHaveBeenCalledWith(401);
    expect((reply as any).send).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return sessions for authenticated user', async () => {
    const sessionsResult = {
      sessions: [
        {
          id: 'session-1',
          deviceInfo: 'Chrome on macOS',
          createdAt: new Date(),
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isCurrent: true,
        },
      ],
    };
    const mockUseCase: IListSessionsUseCase = {
      execute: vi.fn().mockResolvedValue(sessionsResult),
    };
    const controller = new ListSessionsController(mockUseCase);
    const request = createMockRequest('user-123', 'raw-token');
    const reply = createMockReply();

    await controller.handle(request, reply);

    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        currentTokenHash: expect.any(String),
      })
    );
    expect((reply as any).status).toHaveBeenCalledWith(200);
    expect((reply as any).send).toHaveBeenCalledWith(sessionsResult);
  });
});
