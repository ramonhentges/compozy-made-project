import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RegisterPage } from '../routes/register';
import { AuthError } from '../api/auth.functions';
import React from 'react';

vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  return {
    Link: ({ to, children, ...props }: any) => 
      React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => vi.fn(),
    useRouter: () => ({ navigate: vi.fn() }),
    RouterProvider: ({ children }: any) => children,
  };
});

vi.mock('../api/auth.functions', async () => {
  const actual = await vi.importActual('../api/auth.functions');
  return {
    ...actual,
    registerFn: vi.fn(),
  };
});

import { registerFn } from '../api/auth.functions';
const mockRegisterFn = registerFn as ReturnType<typeof vi.fn>;

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <React.Fragment key="router-wrapper">{children}</React.Fragment>;
}

describe('register.page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render registration form with heading', () => {
      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const heading = container.querySelector('h3');
      expect(heading).toBeTruthy();
      expect(heading?.textContent?.toLowerCase()).toContain('create account');
    });

    it('should render form description', () => {
      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      expect(container.textContent).toMatch(/account|information/i);
    });

    it('should render submit button', () => {
      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      expect(container.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should render login link', () => {
      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      expect(container.querySelector('a[href="/login"]')).toBeTruthy();
    });
  });

  describe('input rendering', () => {
    it('should render email input field', () => {
      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input[type="text"], input[type="email"]');
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should render password input field', () => {
      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const passwordInput = container.querySelector('input[type="password"]');
      expect(passwordInput).toBeInTheDocument();
    });
  });
});

describe('registerFn integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export registerFn from auth.functions', () => {
    expect(typeof registerFn).toBe('function');
  });

  it('should export AuthError class', () => {
    expect(new AuthError('test', 'CODE', 400)).toBeInstanceOf(Error);
  });
});