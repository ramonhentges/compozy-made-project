import { describe, it, expect, vi } from 'vitest';
import { RevokeSessionController } from './revoke_session_controller';
import { IRevokeSessionUseCase } from '../../../application/revoke_session/port';
import { SessionNotFoundError } from '../../../domain/errors/session_not_found_error';
import { UnauthorizedSessionError } from '../../../domain/errors/unauthorized_session_error';
import { CookieConfig } from '../utils/cookie_config';

const mockCookieConfig: CookieConfig = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  partitioned: true,
};

function createMockRequest(userId?: string, cookieToken?: string, sessionId?: string) {
  return {
    user: userId ? { userId } : undefined,
    cookies: cookieToken ? { refreshToken: cookieToken } : {},
    params: { id: sessionId || 'session-1' },
  } as unknown as Parameters<RevokeSessionController['handle']>[0];
}

function createMockReply() {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
  return reply as unknown as Parameters<RevokeSessionController['handle']>[1];
}

describe('RevokeSessionController', () => {
  it('should return 401 when user is not authenticated', async () => {
    const mockUseCase: IRevokeSessionUseCase = {
      execute: vi.fn(),
    };
    const controller = new RevokeSessionController(mockUseCase, mockCookieConfig);
    const request = createMockRequest();
    const reply = createMockReply();

    await controller.handle(request, reply);

    expect((reply as any).status).toHaveBeenCalledWith(401);
    expect((reply as any).send).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should revoke session and clear cookie for current session', async () => {
    const mockUseCase: IRevokeSessionUseCase = {
      execute: vi.fn().mockResolvedValue({ wasCurrentSession: true }),
    };
    const controller = new RevokeSessionController(mockUseCase, mockCookieConfig);
    const request = createMockRequest('user-123', 'raw-token', 'session-1');
    const reply = createMockReply();

    await controller.handle(request, reply);

    expect(mockUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        sessionId: 'session-1',
        currentTokenHash: expect.any(String),
      })
    );
    expect((reply as any).clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ httpOnly: true }));
    expect((reply as any).status).toHaveBeenCalledWith(200);
    expect((reply as any).send).toHaveBeenCalledWith({});
  });

  it('should revoke session without clearing cookie for non-current session', async () => {
    const mockUseCase: IRevokeSessionUseCase = {
      execute: vi.fn().mockResolvedValue({ wasCurrentSession: false }),
    };
    const controller = new RevokeSessionController(mockUseCase, mockCookieConfig);
    const request = createMockRequest('user-123', 'raw-token', 'session-1');
    const reply = createMockReply();

    await controller.handle(request, reply);

    expect((reply as any).clearCookie).not.toHaveBeenCalled();
    expect((reply as any).status).toHaveBeenCalledWith(200);
  });

  it('should return 404 when session is not found', async () => {
    const mockUseCase: IRevokeSessionUseCase = {
      execute: vi.fn().mockRejectedValue(new SessionNotFoundError('session-1')),
    };
    const controller = new RevokeSessionController(mockUseCase, mockCookieConfig);
    const request = createMockRequest('user-123', undefined, 'session-1');
    const reply = createMockReply();

    await controller.handle(request, reply);

    expect((reply as any).status).toHaveBeenCalledWith(404);
    expect((reply as any).send).toHaveBeenCalledWith({ error: 'Session not found' });
  });

  it('should return 403 when session belongs to another user', async () => {
    const mockUseCase: IRevokeSessionUseCase = {
      execute: vi.fn().mockRejectedValue(new UnauthorizedSessionError()),
    };
    const controller = new RevokeSessionController(mockUseCase, mockCookieConfig);
    const request = createMockRequest('user-123', undefined, 'session-1');
    const reply = createMockReply();

    await controller.handle(request, reply);

    expect((reply as any).status).toHaveBeenCalledWith(403);
    expect((reply as any).send).toHaveBeenCalledWith({ error: 'Forbidden' });
  });
});
