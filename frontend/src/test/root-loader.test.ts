import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadAuthSession } from '../router';
import { useAuthStore } from '../stores/auth.store';
import type { User } from '../stores/auth.store';

function createFakeJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: Math.floor(exp / 1000) }));
  const signature = btoa('fake-signature');
  return `${header}.${payload}.${signature}`;
}

describe('root loader - loadAuthSession', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('valid token exists in store', () => {
    it('should skip refresh API call when token is still valid', async () => {
      const mockUser: User = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      const validToken = createFakeJwt(Date.now() + 5 * 60 * 1000); // 5 min from now
      useAuthStore.getState().setAuth(validToken, mockUser);

      globalThis.fetch = vi.fn();

      const result = await loadAuthSession();

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(result).toEqual({ accessToken: validToken, user: mockUser });
    });

    it('should call refresh when token is within 30s of expiry', async () => {
      const mockUser: User = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      const nearExpiryToken = createFakeJwt(Date.now() + 15 * 1000); // 15s from now
      useAuthStore.getState().setAuth(nearExpiryToken, mockUser);

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ accessToken: 'new-token', user: mockUser }),
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await loadAuthSession();

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/token/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      expect(result.accessToken).toBe('new-token');
    });
  });

  describe('happy path: cookie exists', () => {
    it('should return accessToken and user when refresh succeeds', async () => {
      const mockUser: User = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ accessToken: 'access-token', user: mockUser }),
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await loadAuthSession();

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/token/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      expect(result).toEqual({ accessToken: 'access-token', user: mockUser });
    });
  });

  describe('happy path: no cookie', () => {
    it('should return null token when 401 response', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await loadAuthSession();

      expect(result).toEqual({ accessToken: null, user: null });
    });

    it('should return null token when fetch fails with network error', async () => {
      const mockResponse = {
        ok: false,
        status: 0,
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await loadAuthSession();

      expect(result).toEqual({ accessToken: null, user: null });
    });
  });

  describe('error path: refresh fails', () => {
    it('should return null token when server returns 500', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await loadAuthSession();

      expect(result).toEqual({ accessToken: null, user: null });
    });

    it('should return null token when network error throws', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await loadAuthSession();

      expect(result).toEqual({ accessToken: null, user: null });
    });
  });

  describe('edge case: expired token handled', () => {
    it('should return null token when 401 response for expired token', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await loadAuthSession();

      expect(result).toEqual({ accessToken: null, user: null });
    });

    it('should call refresh when stored token is already expired', async () => {
      const expiredToken = createFakeJwt(Date.now() - 60 * 1000); // 1 min ago
      useAuthStore.getState().setAuth(expiredToken, { id: 'user-1', email: 'test@example.com', name: 'Test User' });

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ accessToken: 'new-token', user: { id: 'user-1', email: 'test@example.com', name: 'Test User' } }),
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await loadAuthSession();

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/token/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      expect(result.accessToken).toBe('new-token');
    });
  });
});

describe('root loader - AuthLoaderData interface', () => {
  it('should accept valid data structure', () => {
    const data = { accessToken: 'token', user: null };
    expect(data.accessToken).toBe('token');
    expect(data.user).toBeNull();
  });

  it('should accept null auth data', () => {
    const data = { accessToken: null, user: null };
    expect(data.accessToken).toBeNull();
    expect(data.user).toBeNull();
  });
});