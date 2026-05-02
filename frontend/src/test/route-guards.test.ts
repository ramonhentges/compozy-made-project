import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requireUnauthGuard, loadAuthSession } from '../router';
import { useAuthStore } from '../stores/auth.store';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    redirect: (opts: { to: string }) => {
      const error = new Error(`Redirect to ${opts.to}`);
      (error as unknown as { status: number }).status = 302;
      return error;
    },
  };
});

describe('requireUnauthGuard - authenticated route guards for public routes', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  describe('unauthenticated users', () => {
    it('should allow access when no accessToken exists', () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(() => requireUnauthGuard()).not.toThrow();
    });
  });

  describe('authenticated users', () => {
    it('should redirect to /home when accessToken exists', () => {
      useAuthStore.getState().setAuth('test-token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(useAuthStore.getState().accessToken).toBe('test-token');
      expect(() => requireUnauthGuard()).toThrow('Redirect to /home');
    });

    it('should redirect to /home for all public routes', () => {
      useAuthStore.getState().setAuth('another-token', {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two',
      });

      expect(() => requireUnauthGuard()).toThrow('Redirect to /home');
    });
  });

  describe('edge cases', () => {
    it('should allow access when token is empty string', () => {
      // Simulating edge case where token might be falsy
      useAuthStore.setState({ accessToken: '' as unknown as null });
      expect(() => requireUnauthGuard()).not.toThrow();
    });

    it('should redirect when token is present after logout and re-login', () => {
      useAuthStore.getState().setAuth('token-a', {
        id: 'user-a',
        email: 'a@example.com',
        name: 'User A',
      });
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(() => requireUnauthGuard()).not.toThrow();

      useAuthStore.getState().setAuth('token-b', {
        id: 'user-b',
        email: 'b@example.com',
        name: 'User B',
      });
      expect(() => requireUnauthGuard()).toThrow('Redirect to /home');
    });
  });
});

describe('root loader - session restoration', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should return auth data when session refresh succeeds', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ accessToken: 'access-token', user: mockUser }),
    } as unknown as Response;

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await loadAuthSession();

    expect(result.accessToken).toBe('access-token');
    expect(result.user).toEqual(mockUser);
  });

  it('should return null auth data when session refresh fails', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
    } as unknown as Response;

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await loadAuthSession();

    expect(result.accessToken).toBeNull();
    expect(result.user).toBeNull();
  });
});
