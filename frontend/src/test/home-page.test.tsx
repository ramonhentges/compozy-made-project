import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from '../routes/home';
import { useAuthStore } from '../stores/auth.store';
import React from 'react';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  return {
    useLoaderData: () => ({ user: useAuthStore.getState().user }),
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...props }: any) =>
      React.createElement('a', { href: to, ...props }, children),
  };
});

vi.mock('../api/auth.functions', async () => {
  const actual = await vi.importActual('../api/auth.functions');
  return {
    ...actual,
    logoutFn: vi.fn(),
  };
});

import { logoutFn } from '../api/auth.functions';
const mockLogoutFn = logoutFn as ReturnType<typeof vi.fn>;

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <React.Fragment key="router-wrapper">{children}</React.Fragment>;
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  describe('rendering', () => {
    it('should render dashboard heading', () => {
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      const heading = container.querySelector('h2');
      expect(heading).toBeTruthy();
      expect(heading?.textContent).toContain('Dashboard');
    });

    it('should render logout button', () => {
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      const logoutButton = container.querySelector('button');
      expect(logoutButton).toBeTruthy();
      expect(logoutButton?.textContent?.toLowerCase()).toContain('logout');
    });

    it('should display welcome message with user name', () => {
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      expect(container.textContent).toContain('Welcome back');
      expect(container.textContent).toContain('Test User');
    });

    it('should display account details section', () => {
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      expect(container.textContent).toContain('Account Details');
      expect(container.textContent).toContain('test@example.com');
    });

    it('should show loading state when user is null', () => {
      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      expect(container.textContent).toContain('Loading user information');
    });
  });

  describe('logout interaction', () => {
    it('should call logoutFn when logout button is clicked', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      mockLogoutFn.mockResolvedValueOnce(undefined);

      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      const logoutButton = container.querySelector('button')!;

      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockLogoutFn).toHaveBeenCalledTimes(1);
      });
    });

    it('should clear auth store after logout', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      mockLogoutFn.mockResolvedValueOnce(undefined);

      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      const logoutButton = container.querySelector('button')!;

      await user.click(logoutButton);

      await waitFor(() => {
        expect(useAuthStore.getState().accessToken).toBeNull();
        expect(useAuthStore.getState().user).toBeNull();
      });
    });

    it('should navigate to /login after logout', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      mockLogoutFn.mockResolvedValueOnce(undefined);

      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      const logoutButton = container.querySelector('button')!;

      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login', replace: true });
      });
    });

    it('should handle logout API failure gracefully', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      mockLogoutFn.mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      const logoutButton = container.querySelector('button')!;

      await user.click(logoutButton);

      await waitFor(() => {
        expect(useAuthStore.getState().accessToken).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login', replace: true });
      });
    });

    it('should still clear store and navigate when logout API throws', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setAuth('token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      mockLogoutFn.mockRejectedValueOnce(new Error('Server error'));

      const { container } = render(<HomePage />, { wrapper: TestWrapper });
      const logoutButton = container.querySelector('button')!;

      await user.click(logoutButton);

      await waitFor(() => {
        expect(useAuthStore.getState().user).toBeNull();
        expect(mockNavigate).toHaveBeenCalledTimes(1);
      });
    });
  });
});
