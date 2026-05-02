import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuthGuard } from '../router';
import { useAuthStore } from '../stores/auth.store';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    redirect: (opts: { to: string; search?: Record<string, string> }) => {
      const error = new Error(`Redirect to ${opts.to}`);
      (error as unknown as { status: number; search?: Record<string, string> }).status = 302;
      (error as unknown as { search?: Record<string, string> }).search = opts.search;
      return error;
    },
  };
});

describe('requireAuthGuard - authenticated route guard for protected routes', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  describe('unauthenticated users', () => {
    it('should redirect to /login when no accessToken exists', () => {
      expect(useAuthStore.getState().accessToken).toBeNull();

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');
    });

    it('should include redirect search param with current pathname', () => {
      try {
        requireAuthGuard({ location: { pathname: '/home' } });
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        const error = err as Error & { search?: Record<string, string> };
        expect(error.search).toEqual({ redirect: '/home' });
      }
    });

    it('should redirect with custom pathname in search param', () => {
      try {
        requireAuthGuard({ location: { pathname: '/home/settings' } });
      } catch (err) {
        const error = err as Error & { search?: Record<string, string> };
        expect(error.search).toEqual({ redirect: '/home/settings' });
      }
    });

    it('should redirect when accessToken exists but user is null', () => {
      useAuthStore.setState({ accessToken: 'token-without-user', user: null });

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');
    });
  });

  describe('authenticated users', () => {
    it('should allow access when both accessToken and user exist', () => {
      useAuthStore.getState().setAuth('test-token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(useAuthStore.getState().accessToken).toBe('test-token');
      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).not.toThrow();
    });

    it('should allow access for any protected route when authenticated', () => {
      useAuthStore.getState().setAuth('another-token', {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two',
      });

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home/profile' } })
      ).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should redirect when token is empty string', () => {
      useAuthStore.setState({ accessToken: '' as unknown as null, user: { id: '1', email: 'a@b.com', name: 'A' } });

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');
    });

    it('should redirect after logout', () => {
      useAuthStore.getState().setAuth('token-a', {
        id: 'user-a',
        email: 'a@example.com',
        name: 'User A',
      });
      useAuthStore.getState().clearAuth();

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');
    });

    it('should allow access after re-login', () => {
      useAuthStore.getState().clearAuth();
      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).toThrow('Redirect to /login');

      useAuthStore.getState().setAuth('token-b', {
        id: 'user-b',
        email: 'b@example.com',
        name: 'User B',
      });

      expect(() =>
        requireAuthGuard({ location: { pathname: '/home' } })
      ).not.toThrow();
    });

    it('should redirect with redirect param for deep links', () => {
      try {
        requireAuthGuard({ location: { pathname: '/home/projects/123' } });
      } catch (err) {
        const error = err as Error & { search?: Record<string, string> };
        expect(error.search).toEqual({ redirect: '/home/projects/123' });
      }
    });
  });
});
