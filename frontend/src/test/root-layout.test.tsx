import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RootLayout } from '../router';
import { useAuthStore } from '../stores/auth.store';
import React from 'react';

vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  return {
    Link: ({ to, children, ...props }: any) =>
      React.createElement('a', { href: to, ...props }, children),
    Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }, 'Outlet Content'),
    createRootRoute: (opts: any) => ({
      ...opts,
      addChildren: vi.fn((children: any[]) => ({ ...opts, children })),
    }),
    createRoute: (opts: any) => opts,
    createRouter: (opts: any) => opts,
    redirect: (opts: any) => {
      const error = new Error(`Redirect to ${opts.to}`);
      (error as any).status = 302;
      (error as any).search = opts.search;
      return error;
    },
    RouterProvider: ({ children }: any) => children,
  };
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <React.Fragment key="router-wrapper">{children}</React.Fragment>;
}

describe('RootLayout', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  describe('unauthenticated state', () => {
    it('should render app title linking to home', () => {
      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      const titleLink = container.querySelector('a[href="/"]');
      expect(titleLink).toBeTruthy();
      expect(titleLink?.textContent).toContain('Compozy');
    });

    it('should render Login link', () => {
      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      const loginLink = container.querySelector('a[href="/login"]');
      expect(loginLink).toBeTruthy();
      expect(loginLink?.textContent?.toLowerCase()).toContain('login');
    });

    it('should render Register link', () => {
      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      const registerLink = container.querySelector('a[href="/register"]');
      expect(registerLink).toBeTruthy();
      expect(registerLink?.textContent?.toLowerCase()).toContain('register');
    });

    it('should not render Dashboard link', () => {
      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      const dashboardLink = container.querySelector('a[href="/home"]');
      expect(dashboardLink).toBeFalsy();
    });

    it('should render outlet content', () => {
      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      expect(container.textContent).toContain('Outlet Content');
    });
  });

  describe('authenticated state', () => {
    it('should render Dashboard link when authenticated', () => {
      useAuthStore.getState().setAuth('test-token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      const dashboardLink = container.querySelector('a[href="/home"]');
      expect(dashboardLink).toBeTruthy();
      expect(dashboardLink?.textContent?.toLowerCase()).toContain('dashboard');
    });

    it('should not render Login link when authenticated', () => {
      useAuthStore.getState().setAuth('test-token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      const loginLink = container.querySelector('a[href="/login"]');
      expect(loginLink).toBeFalsy();
    });

    it('should not render Register link when authenticated', () => {
      useAuthStore.getState().setAuth('test-token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      const registerLink = container.querySelector('a[href="/register"]');
      expect(registerLink).toBeFalsy();
    });

    it('should still render app title when authenticated', () => {
      useAuthStore.getState().setAuth('test-token', {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      const titleLink = container.querySelector('a[href="/"]');
      expect(titleLink).toBeTruthy();
      expect(titleLink?.textContent).toContain('Compozy');
    });
  });

  describe('layout structure', () => {
    it('should have header element', () => {
      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      expect(container.querySelector('header')).toBeTruthy();
    });

    it('should have main element', () => {
      const { container } = render(<RootLayout />, { wrapper: TestWrapper });
      expect(container.querySelector('main')).toBeTruthy();
    });
  });
});
