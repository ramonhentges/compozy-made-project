import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
  type AuthResponse,
} from "./auth.schemas";
import { useAuthStore, type User } from "@/stores/auth.store";

const API_BASE = "/api";
const NO_REFRESH_ENDPOINTS = ["/login", "/register", "/token/refresh"];

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

let refreshPromise: Promise<AuthResponse> | null = null;

async function doRefreshToken(): Promise<AuthResponse> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE}/token/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      throw new AuthError("Session expired", "AUTH_ERROR", res.status);
    }
    const data = (await res.json()) as AuthResponse;
    useAuthStore.getState().setAuth(data.accessToken, data.user);
    return data;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function callApi<T>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const fetchOptions: RequestInit = {
    method: options.method ?? "POST",
    headers,
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  let res = await fetch(url, fetchOptions);

  if (res.status === 401 && !NO_REFRESH_ENDPOINTS.includes(endpoint)) {
    try {
      const refreshed = await doRefreshToken();
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${refreshed.accessToken}`,
      };
      res = await fetch(url, fetchOptions);
    } catch {
      useAuthStore.getState().clearAuth();
    }
  }

  if (!res.ok) {
    let message = "Request failed";
    try {
      const error = await res.json();
      message = error.message || message;
    } catch {
      message = res.statusText || message;
    }
    throw new AuthError(message, "API_ERROR", res.status);
  }

  return res.json() as Promise<T>;
}

export async function registerFn(data: RegisterInput): Promise<{ user: User }> {
  const validated = registerSchema.parse(data);
  const result = await callApi<{ userId: string; email: string; name: string }>(
    "/register",
    { body: validated },
  );
  return {
    user: {
      id: result.userId,
      email: result.email,
      name: result.name,
    },
  };
}

export async function loginFn(data: LoginInput): Promise<AuthResponse> {
  const validated = loginSchema.parse(data);
  return callApi<AuthResponse>("/login", { body: validated });
}

export async function logoutFn(): Promise<void> {
  await callApi<void>("/logout", { body: {} });
}

export async function refreshFn(): Promise<AuthResponse> {
  return doRefreshToken();
}

export interface Session {
  id: string;
  deviceInfo: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  isCurrent: boolean;
}

export interface ListSessionsResult {
  sessions: Session[];
}

export async function listSessionsFn(): Promise<ListSessionsResult> {
  return callApi<ListSessionsResult>("/sessions", { method: "GET" });
}

export async function revokeSessionFn(sessionId: string): Promise<void> {
  return callApi<void>(`/sessions/${sessionId}/revoke`, {
    method: "POST",
    body: {},
  });
}
