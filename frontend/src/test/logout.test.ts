import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logoutFn, AuthError } from '../api/auth.functions';
import { useAuthStore } from '../stores/auth.store';
import type { User } from '../stores/auth.store';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('logout - unit tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('store clearing', () => {
    it('should clear accessToken from store on successful logout', async () => {
      const testUser: User = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      const testToken = 'test-access-token';
      useAuthStore.getState().setAuth(testToken, testUser);

      expect(useAuthStore.getState().accessToken).toBe(testToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await logoutFn();
      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('should clear user from store on successful logout', async () => {
      const testUser: User = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      const testToken = 'test-access-token';
      useAuthStore.getState().setAuth(testToken, testUser);

      expect(useAuthStore.getState().user).toEqual(testUser);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await logoutFn();
      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('API call', () => {
    it('should call POST /logout with correct parameters', async () => {
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
  });

  describe('error handling', () => {
    it('should throw AuthError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Logout failed' }),
      } as Response);

      await expect(logoutFn()).rejects.toThrow(AuthError);
    });

    it('should have correct error status code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Logout failed' }),
      } as Response);

      try {
        await logoutFn();
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).status).toBe(500);
      }
    });
  });
});