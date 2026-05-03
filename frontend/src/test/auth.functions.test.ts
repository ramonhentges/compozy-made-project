import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerFn, loginFn, logoutFn, refreshFn, listSessionsFn, revokeSessionFn, AuthError } from '../api/auth.functions';
import { useAuthStore } from '../stores/auth.store';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('auth.functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('registerFn', () => {
    const validPassword = 'Password123!';

    it('calls POST /register with validated data and maps response', async () => {
      const mockResponse = { userId: '1', email: 'test@example.com', name: 'Test User' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await registerFn({
        email: 'test@example.com',
        name: 'Test User',
        password: validPassword,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: 'test@example.com', name: 'Test User', password: validPassword }),
        })
      );
      expect(result).toEqual({ user: { id: '1', email: 'test@example.com', name: 'Test User' } });
    });

    it('throws AuthError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Email already exists' }),
      } as Response);

      await expect(
        registerFn({ email: 'exists@example.com', name: 'Test', password: validPassword })
      ).rejects.toThrow(AuthError);
    });

    it('validates input with registerSchema', async () => {
      await expect(
        registerFn({ email: 'invalid-email', name: 'Test', password: validPassword })
      ).rejects.toThrow('Invalid email address');
    });

    it('validates password minimum length', async () => {
      await expect(
        registerFn({ email: 'test@example.com', name: 'Test', password: 'short' })
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('validates password complexity (uppercase)', async () => {
      await expect(
        registerFn({ email: 'test@example.com', name: 'Test', password: 'password123!' })
      ).rejects.toThrow('Password must contain at least one uppercase letter');
    });

    it('validates password complexity (lowercase)', async () => {
      await expect(
        registerFn({ email: 'test@example.com', name: 'Test', password: 'PASSWORD123!' })
      ).rejects.toThrow('Password must contain at least one lowercase letter');
    });

    it('validates password complexity (number)', async () => {
      await expect(
        registerFn({ email: 'test@example.com', name: 'Test', password: 'Password!!!' })
      ).rejects.toThrow('Password must contain at least one number');
    });

    it('validates password complexity (special character)', async () => {
      await expect(
        registerFn({ email: 'test@example.com', name: 'Test', password: 'Password123' })
      ).rejects.toThrow('Password must contain at least one special character');
    });
  });

  describe('loginFn', () => {
    it('calls POST /login with validated data', async () => {
      const mockResponse = {
        accessToken: 'token123',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await loginFn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws AuthError on invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      } as Response);

      await expect(
        loginFn({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('validates email format', async () => {
      await expect(loginFn({ email: 'not-an-email', password: 'password' })).rejects.toThrow(
        'Invalid email address'
      );
    });

    it('validates required password', async () => {
      await expect(loginFn({ email: 'test@example.com', password: '' })).rejects.toThrow(
        'Password is required'
      );
    });
  });

  describe('logoutFn', () => {
    it('calls POST /logout with Authorization header when token exists', async () => {
      useAuthStore.getState().setAuth('access-token', { id: '1', email: 'test@example.com', name: 'Test User' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await logoutFn();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/logout',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer access-token',
          },
          credentials: 'include',
        })
      );
    });

    it('calls POST /logout without Authorization header when no token exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await logoutFn();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/logout',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
      );
    });

    it('handles logout error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Logout failed' }),
      } as Response);

      await expect(logoutFn()).rejects.toThrow(AuthError);
    });
  });

  describe('refreshFn', () => {
    it('calls POST /token/refresh', async () => {
      const mockResponse = {
        accessToken: 'newtoken',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await refreshFn();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/token/refresh',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws AuthError on refresh failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Refresh token expired' }),
      } as Response);

      await expect(refreshFn()).rejects.toThrow(AuthError);
    });
  });

  describe('listSessionsFn', () => {
    it('calls GET /sessions', async () => {
      const mockResponse = {
        sessions: [
          { id: 'sess-1', deviceInfo: 'Chrome / macOS', createdAt: '2024-01-01T00:00:00Z', lastUsedAt: '2024-01-02T00:00:00Z', expiresAt: '2024-02-01T00:00:00Z', isCurrent: true },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await listSessionsFn();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sessions',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws AuthError on list sessions failure after refresh also fails', async () => {
      useAuthStore.getState().setAuth('old-token', { id: '1', email: 'test@example.com', name: 'Test User' });

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ message: 'Not authenticated' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ message: 'Refresh token expired' }),
        } as Response);

      await expect(listSessionsFn()).rejects.toThrow(AuthError);
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  describe('revokeSessionFn', () => {
    it('calls POST /sessions/:id/revoke', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await revokeSessionFn('sess-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sessions/sess-1/revoke',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('throws AuthError on revoke failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Session not found' }),
      } as Response);

      await expect(revokeSessionFn('sess-unknown')).rejects.toThrow(AuthError);
    });
  });

  describe('401 auto-retry', () => {
    it('should retry original request after successful token refresh', async () => {
      useAuthStore.getState().setAuth('old-token', { id: '1', email: 'test@example.com', name: 'Test User' });

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ accessToken: 'new-token', user: { id: '1', email: 'test@example.com', name: 'Test User' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sessions: [{ id: 'sess-1', deviceInfo: 'Chrome', createdAt: '2024-01-01T00:00:00Z', lastUsedAt: null, expiresAt: '2024-02-01T00:00:00Z', isCurrent: true }] }),
        } as Response);

      const result = await listSessionsFn();

      expect(result.sessions).toHaveLength(1);
      expect(useAuthStore.getState().accessToken).toBe('new-token');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should clear auth store when refresh fails on 401', async () => {
      useAuthStore.getState().setAuth('old-token', { id: '1', email: 'test@example.com', name: 'Test User' });

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Refresh token expired' }),
        } as Response);

      await expect(listSessionsFn()).rejects.toThrow(AuthError);
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should not fire multiple refresh requests for simultaneous 401s', async () => {
      useAuthStore.getState().setAuth('old-token', { id: '1', email: 'test@example.com', name: 'Test User' });

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ accessToken: 'new-token', user: { id: '1', email: 'test@example.com', name: 'Test User' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sessions: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sessions: [] }),
        } as Response);

      const [result1, result2] = await Promise.all([
        listSessionsFn(),
        listSessionsFn(),
      ]);

      expect(result1.sessions).toEqual([]);
      expect(result2.sessions).toEqual([]);

      const refreshCalls = mockFetch.mock.calls.filter(
        (call) => (call[0] as string).includes('/token/refresh')
      );
      expect(refreshCalls).toHaveLength(1);
    });

    it('should not attempt refresh on login 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      } as Response);

      await expect(
        loginFn({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid credentials');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(loginFn({ email: 'test@example.com', password: 'password' })).rejects.toThrow(
        TypeError
      );
    });

    it('handles non-JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(loginFn({ email: 'test@example.com', password: 'password' })).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('sets correct error code and status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ message: 'Access denied' }),
      } as Response);

      try {
        await loginFn({ email: 'test@example.com', password: 'password' });
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).code).toBe('API_ERROR');
        expect((err as AuthError).status).toBe(403);
      }
    });
  });
});