import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerFn, loginFn, logoutFn, refreshFn, AuthError } from '../api/auth.functions';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('auth.functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('registerFn', () => {
    it('calls POST /register with validated data', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      } as Response);

      const result = await registerFn({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: 'test@example.com', name: 'Test User', password: 'password123' }),
        })
      );
      expect(result).toEqual({ user: mockUser });
    });

    it('throws AuthError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: 'Email already exists' }),
      } as Response);

      await expect(
        registerFn({ email: 'exists@example.com', name: 'Test', password: 'password123' })
      ).rejects.toThrow(AuthError);
    });

    it('validates input with registerSchema', async () => {
      await expect(
        registerFn({ email: 'invalid-email', name: 'Test', password: 'password123' })
      ).rejects.toThrow('Invalid email address');
    });

    it('validates password minimum length', async () => {
      await expect(
        registerFn({ email: 'test@example.com', name: 'Test', password: 'short' })
      ).rejects.toThrow('Password must be at least 8 characters');
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
    it('calls POST /logout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await logoutFn();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/logout',
        expect.objectContaining({
          method: 'POST',
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