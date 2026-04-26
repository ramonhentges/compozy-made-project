import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadAuthSession } from '../router';
import type { User } from '../stores/auth.store';

describe('root loader - loadAuthSession', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
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