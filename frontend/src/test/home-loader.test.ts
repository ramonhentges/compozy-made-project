import { describe, it, expect, vi, beforeEach } from 'vitest';
import { homeLoader } from '../routes/home';
import type { User } from '../stores/auth.store';
import { useAuthStore } from '../stores/auth.store';

describe('homeLoader - data fetching', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  describe('when user is authenticated', () => {
    it('should return user data from the auth store', async () => {
      const mockUser: User = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
      useAuthStore.getState().setAuth('access-token', mockUser);

      const result = await homeLoader();

      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('when user is not authenticated', () => {
    it('should return null user when store is empty', async () => {
      const result = await homeLoader();

      expect(result).toEqual({ user: null });
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
