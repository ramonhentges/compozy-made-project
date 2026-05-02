import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/auth.store';
import { requireUnauthGuard, requireAuthGuard, loadAuthSession } from '../router';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    redirect: (opts: { to: string; search?: Record<string, string> }) => {
      const error = new Error(`Redirect to ${opts.to}`);
      (error as unknown as { status: number }).status = 302;
      (error as unknown as { search?: Record<string, string> }).search = opts.search;
      return error;
    },
  };
});

describe('Auth Flow Integration - Complete User Journey', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    useAuthStore.getState().clearAuth();
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Step 1: Initial visitor state', () => {
    it('should have no auth state on fresh load', () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should allow access to public routes (index)', () => {
      expect(() => requireUnauthGuard()).not.toThrow();
    });

    it('should allow access to public routes (login)', () => {
      expect(() => requireUnauthGuard()).not.toThrow();
    });

    it('should allow access to public routes (register)', () => {
      expect(() => requireUnauthGuard()).not.toThrow();
    });

    it('should redirect unauthenticated user from home to login', () => {
      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');
    });
  });

  describe('Step 2: Session restoration with valid cookie', () => {
    it('should restore session when refresh API returns valid token', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'restored-token', user: mockUser }),
      } as Response);

      const result = await loadAuthSession();

      expect(result.accessToken).toBe('restored-token');
      expect(result.user).toEqual(mockUser);
    });

    it('should set auth store after successful session restoration', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'restored-token', user: mockUser }),
      } as Response);

      const authData = await loadAuthSession();
      useAuthStore.getState().setAuth(authData.accessToken!, authData.user!);

      expect(useAuthStore.getState().accessToken).toBe('restored-token');
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should allow home access after session restoration', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'restored-token', user: mockUser }),
      } as Response);

      const authData = await loadAuthSession();
      useAuthStore.getState().setAuth(authData.accessToken!, authData.user!);

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).not.toThrow();
    });
  });

  describe('Step 3: Session restoration with expired/invalid cookie', () => {
    it('should keep store empty when refresh returns 401', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      const result = await loadAuthSession();
      expect(result.accessToken).toBeNull();
      expect(result.user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('should redirect to login when accessing home after failed restoration', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      await loadAuthSession();

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');
    });
  });

  describe('Step 4: Manual login flow', () => {
    it('should set auth store after successful login', () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setAuth('login-token', mockUser);

      expect(useAuthStore.getState().accessToken).toBe('login-token');
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should redirect authenticated user away from login page', () => {
      useAuthStore.getState().setAuth('login-token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(() => requireUnauthGuard()).toThrow('Redirect to /home');
    });

    it('should redirect authenticated user away from register page', () => {
      useAuthStore.getState().setAuth('login-token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(() => requireUnauthGuard()).toThrow('Redirect to /home');
    });

    it('should allow access to home after manual login', () => {
      useAuthStore.getState().setAuth('login-token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).not.toThrow();
    });
  });

  describe('Step 5: Logout flow', () => {
    it('should clear auth store on logout', () => {
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should redirect to login after logout when accessing home', () => {
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      useAuthStore.getState().clearAuth();

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');
    });

    it('should allow access to public routes after logout', () => {
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      useAuthStore.getState().clearAuth();

      expect(() => requireUnauthGuard()).not.toThrow();
    });
  });

  describe('Step 6: Full lifecycle', () => {
    it('should complete full auth lifecycle: anonymous -> login -> home -> logout -> anonymous', () => {
      // Anonymous
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(() => requireUnauthGuard()).not.toThrow();
      expect(() => requireAuthGuard({ location: { pathname: '/home' } })).toThrow('Redirect to /login');

      // Login
      const user = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setAuth('session-token', user);
      expect(useAuthStore.getState().accessToken).toBe('session-token');
      expect(() => requireUnauthGuard()).toThrow('Redirect to /home');
      expect(() => requireAuthGuard({ location: { pathname: '/home' } })).not.toThrow();

      // Logout
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(() => requireUnauthGuard()).not.toThrow();
      expect(() => requireAuthGuard({ location: { pathname: '/home' } })).toThrow('Redirect to /login');
    });

    it('should handle re-login after logout', () => {
      const user1 = { id: 'user-1', email: 'first@example.com', name: 'First User' };
      const user2 = { id: 'user-2', email: 'second@example.com', name: 'Second User' };

      // First login
      useAuthStore.getState().setAuth('token-1', user1);
      expect(useAuthStore.getState().user).toEqual(user1);

      // Logout
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().accessToken).toBeNull();

      // Second login
      useAuthStore.getState().setAuth('token-2', user2);
      expect(useAuthStore.getState().accessToken).toBe('token-2');
      expect(useAuthStore.getState().user).toEqual(user2);
      expect(() => requireAuthGuard({ location: { pathname: '/home' } })).not.toThrow();
    });

    it('should preserve redirect intent through login flow', async () => {
      // User tries to access /home/settings while unauthenticated
      expect(() =>
        requireAuthGuard({ location: { pathname: '/home/settings' } })
      ).toThrow('Redirect to /login');

      // After login, user should be able to access the original path
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home/settings' } })
      ).not.toThrow();
    });
  });

  describe('Edge cases across the flow', () => {
    it('should handle token-only state as unauthenticated for home guard', () => {
      useAuthStore.setState({ accessToken: 'token', user: null });

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');
    });

    it('should handle user-only state as unauthenticated for home guard', () => {
      useAuthStore.setState({
        accessToken: null,
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      });

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');
    });

    it('should treat falsy token as unauthenticated for unauth guard', () => {
      useAuthStore.setState({ accessToken: '' as unknown as null, user: null });
      expect(() => requireUnauthGuard()).not.toThrow();
    });

    it('should handle rapid login-logout-login cycles', () => {
      const user = { id: 'user-1', email: 'test@example.com', name: 'Test User' };

      // Login
      useAuthStore.getState().setAuth('token-1', user);
      expect(useAuthStore.getState().accessToken).toBe('token-1');

      // Logout
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().accessToken).toBeNull();

      // Login again
      useAuthStore.getState().setAuth('token-2', user);
      expect(useAuthStore.getState().accessToken).toBe('token-2');

      // Logout again
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().accessToken).toBeNull();

      // Final login
      useAuthStore.getState().setAuth('token-3', user);
      expect(useAuthStore.getState().accessToken).toBe('token-3');
      expect(() => requireAuthGuard({ location: { pathname: '/home' } })).not.toThrow();
    });
  });
});
