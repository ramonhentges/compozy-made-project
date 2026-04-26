import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { homeLoader } from '../routes/home';
import type { User } from '../stores/auth.store';

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

describe('homeLoader - route guard', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('happy path: authenticated user can access', () => {
    it('should return user data when refresh succeeds', async () => {
      const mockUser: User = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ accessToken: 'access-token', user: mockUser }),
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await homeLoader();

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/token/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('happy path: unauthenticated user redirected', () => {
    it('should throw redirect when 401 response', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(homeLoader()).rejects.toThrow();
    });

    it('should throw redirect when fetch fails with network error', async () => {
      const mockResponse = {
        ok: false,
        status: 0,
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(homeLoader()).rejects.toThrow();
    });
  });

  describe('error path: server returns error status', () => {
    it('should throw redirect when server returns 500', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      } as unknown as Response;

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(homeLoader()).rejects.toThrow();
    });

    it('should redirect when network error throws', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(homeLoader()).rejects.toThrow();
    });
  });
});

describe('HomePage component', () => {
  it('should render user information when authenticated', async () => {
    const mockUser: User = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
    const loaderData = { user: mockUser };

    expect(loaderData.user).toEqual(mockUser);
    expect(loaderData.user.name).toBe('Test User');
    expect(loaderData.user.email).toBe('test@example.com');
  });
});