import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterPage } from '../routes/register';
import { AuthError } from '../api/auth.functions';
import React from 'react';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  return {
    Link: ({ to, children, ...props }: any) =>
      React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => mockNavigate,
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

describe('RegisterPage - form interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('form submission', () => {
    it('should call registerFn with form data on submit', async () => {
      const user = userEvent.setup();
      mockRegisterFn.mockResolvedValueOnce({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      });

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'test@example.com');
      await user.type(inputs[1], 'Test User');
      await user.type(inputs[2], 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegisterFn).toHaveBeenCalledWith({
          email: 'test@example.com',
          name: 'Test User',
          password: 'Password123!',
        });
      });
    });

    it('should navigate to /login with success message after registration', async () => {
      const user = userEvent.setup();
      mockRegisterFn.mockResolvedValueOnce({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      });

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'test@example.com');
      await user.type(inputs[1], 'Test User');
      await user.type(inputs[2], 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({
          to: '/login',
          search: { message: 'Registration successful! Please log in.' },
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveRegistration: (value: unknown) => void;
      const registrationPromise = new Promise((resolve) => {
        resolveRegistration = resolve;
      });
      mockRegisterFn.mockReturnValueOnce(registrationPromise);

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'test@example.com');
      await user.type(inputs[1], 'Test User');
      await user.type(inputs[2], 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton.textContent).toContain('Creating account');
      });

      resolveRegistration!({ user: { id: '1', email: 'test@example.com', name: 'Test User' } });
    });
  });

  describe('error handling', () => {
    it('should display API error message for generic errors', async () => {
      const user = userEvent.setup();
      mockRegisterFn.mockRejectedValueOnce(new AuthError('Server error', 'API_ERROR', 500));

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'test@example.com');
      await user.type(inputs[1], 'Test User');
      await user.type(inputs[2], 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(container.textContent).toContain('Server error');
      });
    });

    it('should show email field error for 409 conflict', async () => {
      const user = userEvent.setup();
      mockRegisterFn.mockRejectedValueOnce(new AuthError('Email already exists', 'API_ERROR', 409));

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'exists@example.com');
      await user.type(inputs[1], 'Test User');
      await user.type(inputs[2], 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(container.textContent).toContain('already registered');
      });
    });

    it('should show unexpected error for non-AuthError errors', async () => {
      const user = userEvent.setup();
      mockRegisterFn.mockRejectedValueOnce(new Error('Network failure'));

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'test@example.com');
      await user.type(inputs[1], 'Test User');
      await user.type(inputs[2], 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(container.textContent).toContain('unexpected error');
      });
    });

    it('should clear previous error on new submission', async () => {
      const user = userEvent.setup();
      mockRegisterFn.mockRejectedValueOnce(new AuthError('First error', 'API_ERROR', 500));

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'test@example.com');
      await user.type(inputs[1], 'Test User');
      await user.type(inputs[2], 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(container.textContent).toContain('First error');
      });

      mockRegisterFn.mockRejectedValueOnce(new AuthError('Second error', 'API_ERROR', 500));
      await user.click(submitButton);

      await waitFor(() => {
        expect(container.textContent).toContain('Second error');
        expect(container.textContent).not.toContain('First error');
      });
    });
  });

  describe('form validation', () => {
    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'invalid-email');
      await user.type(inputs[1], 'Test User');
      await user.type(inputs[2], 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(container.textContent).toMatch(/invalid|email/i);
      });
      expect(mockRegisterFn).not.toHaveBeenCalled();
    });

    it('should show validation error for weak password', async () => {
      const user = userEvent.setup();

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'test@example.com');
      await user.type(inputs[1], 'Test User');
      await user.type(inputs[2], 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        expect(container.textContent).toMatch(/password|8|characters/i);
      });
      expect(mockRegisterFn).not.toHaveBeenCalled();
    });

    it('should show validation error for short name', async () => {
      const user = userEvent.setup();

      const { container } = render(<RegisterPage />, { wrapper: TestWrapper });
      const inputs = container.querySelectorAll('input');
      const submitButton = container.querySelector('button[type="submit"]')!;

      await user.type(inputs[0], 'test@example.com');
      await user.type(inputs[1], 'A');
      await user.type(inputs[2], 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(container.textContent).toMatch(/name|2|characters/i);
      });
    });
  });
});
