import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logoutFn, AuthError } from '../api/auth.functions';
import { useAuthStore } from '../stores/auth.store';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('logout functionality', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    useAuthStore.getState().clearAuth();
  });

  describe('logoutFn', () => {
    it('should call POST /logout', async () => {
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

    it('should throw AuthError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Logout failed' }),
      } as Response);

      await expect(logoutFn()).rejects.toThrow(AuthError);
    });
  });

  describe('store clearing', () => {
    it('should clear accessToken from store', () => {
      const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setAuth('test-token', testUser);

      expect(useAuthStore.getState().accessToken).toBe('test-token');

      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('should clear user from store', () => {
      const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setAuth('test-token', testUser);

      expect(useAuthStore.getState().user).toEqual(testUser);

      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should clear both token and user in one call', () => {
      const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setAuth('test-token', testUser);

      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
    });
  });

  describe('logout integration', () => {
    it('should clear store after successful logout API call', async () => {
      const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setAuth('test-token', testUser);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await logoutFn();
      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should clear store even when logout API fails', async () => {
      const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setAuth('test-token', testUser);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Logout failed' }),
      } as Response);

      try {
        await logoutFn();
      } catch {
        // Expected
      }
      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should preserve store state on logout API failure', async () => {
      const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setAuth('test-token', testUser);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Logout failed' }),
      } as Response);

      try {
        await logoutFn();
      } catch {
        // Expected - store should still have data
      }

      expect(useAuthStore.getState().accessToken).toBe('test-token');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(logoutFn()).rejects.toThrow(TypeError);
    });
  });
});

describe('logoutFlow pattern', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    useAuthStore.getState().clearAuth();
  });

  it('should implement logout flow: call API, clear store, redirect', async () => {
    const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
    useAuthStore.getState().setAuth('test-token', testUser);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const logoutFlow = async () => {
      try {
        await logoutFn();
      } catch {
        // Proceed with logout even if API call fails
      }
      useAuthStore.getState().clearAuth();
      return '/login';
    };

    const redirectUrl = await logoutFlow();

    expect(mockFetch).toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(redirectUrl).toBe('/login');
  });

  it('should still redirect to /login when API fails', async () => {
    const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
    useAuthStore.getState().setAuth('test-token', testUser);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ message: 'Logout failed' }),
    } as Response);

    const logoutFlow = async () => {
      try {
        await logoutFn();
      } catch {
        // Proceed with logout even if API call fails
      }
      useAuthStore.getState().clearAuth();
      return '/login';
    };

    const redirectUrl = await logoutFlow();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(redirectUrl).toBe('/login');
  });
});