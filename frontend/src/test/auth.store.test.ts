import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, type User } from '../stores/auth.store';

describe('auth.store', () => {
  const testUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const testToken = 'test-access-token';

  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  describe('initial state', () => {
    it('should have null accessToken initially', () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('should have null user initially', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('should set accessToken and user', () => {
      useAuthStore.getState().setAuth(testToken, testUser);

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe(testToken);
      expect(state.user).toEqual(testUser);
    });

    it('should replace previous auth data', () => {
      useAuthStore.getState().setAuth(testToken, testUser);

      const newUser: User = { id: 'user-2', email: 'new@example.com', name: 'New User' };
      const newToken = 'new-access-token';
      useAuthStore.getState().setAuth(newToken, newUser);

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe(newToken);
      expect(state.user).toEqual(newUser);
    });
  });

  describe('clearAuth', () => {
    it('should clear accessToken', () => {
      useAuthStore.getState().setAuth(testToken, testUser);
      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('should clear user', () => {
      useAuthStore.getState().setAuth(testToken, testUser);
      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should clear all auth data in one call', () => {
      useAuthStore.getState().setAuth(testToken, testUser);
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
    });
  });
});