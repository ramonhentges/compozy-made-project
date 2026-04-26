import { registerSchema, loginSchema, type RegisterInput, type LoginInput, type AuthResponse } from './auth.schemas';
import type { User } from '@/stores/auth.store';

const API_BASE = '/api';

export class AuthError extends Error {
  constructor(message: string, public code: string, public status?: number) {
    super(message);
    this.name = 'AuthError';
  }
}

async function callApi<T>(endpoint: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const error = await res.json();
      message = error.message || message;
    } catch {
      message = res.statusText || message;
    }
    throw new AuthError(message, 'API_ERROR', res.status);
  }

  return res.json() as Promise<T>;
}

export async function registerFn(data: RegisterInput): Promise<{ user: User }> {
  const validated = registerSchema.parse(data);
  return callApi<{ user: User }>('/register', validated);
}

export async function loginFn(data: LoginInput): Promise<AuthResponse> {
  const validated = loginSchema.parse(data);
  return callApi<AuthResponse>('/login', validated);
}

export async function logoutFn(): Promise<void> {
  await callApi<void>('/logout');
}

export async function refreshFn(): Promise<AuthResponse> {
  return callApi<AuthResponse>('/token/refresh');
}