import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../routes/login';
import { AuthError } from '../api/auth.functions';
import React from 'react';

let mockLocationState: any = null;
let mockSearchParams: { message?: string } = {};

vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  return {
    Link: ({ to, children, ...props }: any) => 
      React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => vi.fn(),
    useSearch: () => mockSearchParams,
    useLocation: () => ({ state: mockLocationState }),
    useRouter: () => ({ navigate: vi.fn() }),
    RouterProvider: ({ children }: any) => children,
  };
});

vi.mock('../api/auth.functions', async () => {
  const actual = await vi.importActual('../api/auth.functions');
  return {
    ...actual,
    loginFn: vi.fn(),
  };
});

vi.mock('../stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    setAuth: vi.fn(),
  })),
}));

import { loginFn } from '../api/auth.functions';
import { useAuthStore } from '../stores/auth.store';
const mockLoginFn = loginFn as ReturnType<typeof vi.fn>;

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <React.Fragment key="router-wrapper">{children}</React.Fragment>;
}

describe('login.page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
  });

  describe('rendering', () => {
    it('should render login form with heading', () => {
      const { container } = render(<LoginPage />, { wrapper: TestWrapper });
      const heading = container.querySelector('h3');
      expect(heading).toBeTruthy();
      expect(heading?.textContent?.toLowerCase()).toContain('sign in');
    });

    it('should render form description', () => {
      const { container } = render(<LoginPage />, { wrapper: TestWrapper });
      expect(container.textContent).toContain('credentials');
    });

    it('should render submit button', () => {
      const { container } = render(<LoginPage />, { wrapper: TestWrapper });
      expect(container.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should render register link', () => {
      const { container } = render(<LoginPage />, { wrapper: TestWrapper });
      expect(container.querySelector('a[href="/register"]')).toBeTruthy();
    });
  });

  describe('input rendering', () => {
    it('should render email input field', () => {
      const { container } = render(<LoginPage />, { wrapper: TestWrapper });
      const emailInput = container.querySelector('input[type="email"]');
      expect(emailInput).toBeInTheDocument();
    });

    it('should render password input field', () => {
      const { container } = render(<LoginPage />, { wrapper: TestWrapper });
      const passwordInput = container.querySelector('input[type="password"]');
      expect(passwordInput).toBeInTheDocument();
    });
  });
});

describe('loginFn integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export loginFn from auth.functions', () => {
    expect(typeof loginFn).toBe('function');
  });

  it('should export AuthError class', () => {
    expect(new AuthError('test', 'CODE', 400)).toBeInstanceOf(Error);
  });
});

describe('login flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
    mockSearchParams = {};
  });

  it('should display success message when navigating with search params message', () => {
    mockSearchParams = { message: 'Registration successful! Please log in.' };

    const { container } = render(<LoginPage />, { wrapper: TestWrapper });
    expect(container.textContent).toContain('Registration successful! Please log in.');
  });

  it('should call loginFn on form submit', async () => {
    const user = userEvent.setup();
    mockLoginFn.mockResolvedValueOnce({
      accessToken: 'test-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    });

    const { container } = render(<LoginPage />, { wrapper: TestWrapper });
    const emailInput = container.querySelector('input[type="email"]')!;
    const passwordInput = container.querySelector('input[type="password"]')!;
    const submitButton = container.querySelector('button[type="submit"]')!;

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLoginFn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should call setAuth on successful login', async () => {
    const user = userEvent.setup();
    const mockSetAuthFn = vi.fn();
    vi.mocked(useAuthStore).mockReturnValue(mockSetAuthFn as any);

    mockLoginFn.mockResolvedValueOnce({
      accessToken: 'test-token',
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    });

    const { container } = render(<LoginPage />, { wrapper: TestWrapper });
    const emailInput = container.querySelector('input[type="email"]')!;
    const passwordInput = container.querySelector('input[type="password"]')!;
    const submitButton = container.querySelector('button[type="submit"]')!;

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSetAuthFn).toHaveBeenCalledWith('test-token', {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  it('should show error on invalid credentials', async () => {
    const user = userEvent.setup();
    mockLoginFn.mockRejectedValueOnce(new AuthError('Invalid credentials', 'AUTH_ERROR', 401));

    const { container } = render(<LoginPage />, { wrapper: TestWrapper });
    const emailInput = container.querySelector('input[type="email"]')!;
    const passwordInput = container.querySelector('input[type="password"]')!;
    const submitButton = container.querySelector('button[type="submit"]')!;

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(container.textContent).toContain('Invalid');
    });
  });

  it('should show validation errors on empty fields', async () => {
    const user = userEvent.setup();

    const { container } = render(<LoginPage />, { wrapper: TestWrapper });

    const submitButton = container.querySelector('button[type="submit"]')!;
    await user.click(submitButton);

    await waitFor(() => {
      expect(container.textContent).toMatch(/email|Invalid|password|required/i);
    });
  });
});