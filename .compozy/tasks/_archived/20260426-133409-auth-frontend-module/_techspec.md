# Auth Frontend Module — Technical Specification

## Executive Summary

This module implements a complete authentication flow for the frontend: user registration, login, session management with httpOnly refresh token cookies, and protected route guards using TanStack Start + TanStack Router. Access tokens are stored in a Zustand store (client-only), session state is restored via the root route loader, and backend calls use TanStack createServerFn with a Vite proxy. The primary trade-off is SameSite=Lax (required for cross-origin login) versus strict CSRF protection—documented for V2.

## System Architecture

### Component Overview

| Component | Purpose | Location |
|-----------|---------|----------|
| **Auth Store** | Client-side access token + user state | `frontend/src/stores/auth.store.ts` |
| **Root Loader** | Session restoration on page load | `frontend/src/routes/__root.tsx` |
| **Auth Functions** | Server-side API calls to backend | `frontend/src/api/auth.functions.ts` |
| **Register Page** | Registration form with Zod validation | `frontend/src/routes/register.tsx` |
| **Login Page** | Login form with JWT handling | `frontend/src/routes/login.tsx` |
| **Home Page** | Protected page with route guard | `frontend/src/routes/home.tsx` |
| **Logout Handler** | Session invalidation | `frontend/src/api/auth.functions.ts` |
| **Auth Form Components** | Reusable shadcn form UI | `frontend/src/components/auth/` |

### Data Flow

```
User loads app
  → Root loader checks refresh cookie
      ├── Cookie exists → Call /token/refresh → Store access token in Zustand
      └── No cookie → Return { accessToken: null }

User navigates to /home
  → beforeLoad checks auth store
      ├── Has token → Render protected content
      └── No token → Redirect to /login?redirect=/home

User logs in
  → POST to /login via server fn
      → Backend sets httpOnly refresh cookie + returns access token
          → Store token in Zustand → Redirect to protected page

User logs out
  → POST to /logout → Clear Zustand → Redirect to /login
```

## Implementation Design

### Core Interfaces

```typescript
// frontend/src/stores/auth.store.ts
import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => set({ accessToken: token, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
```

### Data Models

```typescript
// frontend/src/api/auth.schemas.ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthResponse = { accessToken: string; user: User };
```

### API Endpoints

Backend endpoints called via server functions:

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| POST | `/register` | Create account | `{ email, name, password }` | `{ user: User }` |
| POST | `/login` | Authenticate | `{ email, password }` | `{ accessToken, user }` + httpOnly cookie |
| POST | `/logout` | Invalidate session | — | Clears cookie |
| POST | `/token/refresh` | Refresh access token | — (uses cookie) | `{ accessToken, user }` |

### Route Structure

```
frontend/src/routes/
├── __root.tsx              # Root route with loader (session restoration)
├── register.tsx            # /register - public
├── login.tsx               # /login - public
└── home.tsx                # /home - protected (requires auth)
```

## Integration Points

### Backend Integration

- **API base URL**: Configured via `VITE_API_URL` environment variable
- **Vite proxy**: Dev server proxies `/api/*` to backend (no CORS needed)
- **Cookie handling**: Backend sets httpOnly cookies; frontend reads via server functions
- **Required backend endpoints**: `/register`, `/login`, `/logout`, `/token/refresh`

### Environment Configuration

```bash
# frontend/.env
VITE_API_URL=http://localhost:3001  # Backend URL
```

```typescript
// frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|-----------|-------------|---------------------|-----------------|
| `frontend/` | new | New frontend directory with auth module | Scaffold frontend if not exists |
| `frontend/src/stores/` | new | Zustand store for auth state | Create auth.store.ts |
| `frontend/src/routes/` | new | Route files with loaders and forms | Create routes directory |
| `frontend/src/api/` | new | Server functions for auth | Create auth.functions.ts |
| `frontend/src/components/auth/` | new | Form UI components | Install shadcn + create components |
| Backend `/register` | modified | Must accept `name` field | Confirm backend API compatibility |
| Backend `/token/refresh` | required | New endpoint needed | Confirm or implement if missing |

## Testing Approach

### Unit Tests

- **Zod schemas**: Validate registration and login input validation
- **Auth store**: Test setAuth/clearAuth state transitions
- **Route guards**: Test beforeLoad redirects with/without auth
- **Form components**: Test validation, error display, loading states

### Integration Tests

- **Full auth flow**: Register → Login → Access protected page → Logout
- **Session restoration**: Refresh page → Verify session restored
- **Protected route access**: Attempt access without auth → Verify redirect

## Development Sequencing

### Build Order

1. **Scaffold frontend** — Install TanStack Start, shadcn/ui, Tailwind, Zustand, React Hook Form, Zod
2. **Configure Vite proxy** — Set up dev server proxy to backend
3. **Create auth store** — Implement Zustand store with skipHydration pattern
4. **Implement root loader** — Session restoration logic in `__root.tsx`
5. **Create auth schemas** — Zod validation schemas shared across forms
6. **Build auth server functions** — registerFn, loginFn, logoutFn, refreshFn
7. **Create register page** — Form with email, name, password; success redirect
8. **Create login page** — Form with email, password; JWT storage; redirect
9. **Create home page** — Protected route with beforeLoad guard
10. **Add logout functionality** — Clear store + redirect to login
11. **Install shadcn components** — button, input, form, card, label
12. **Write tests** — Unit + integration test suite

### Technical Dependencies

- **Backend /register endpoint** must accept `name` field in request body
- **Backend /token/refresh endpoint** must exist and return `{ accessToken, user }`
- **Backend /logout endpoint** must clear the refresh token cookie
- **Vite proxy** configured for development; production uses `VITE_API_URL` directly

## Monitoring and Observability

- **Key metrics**: Registration success rate, login success rate, auth redirect rate
- **Log events**: Auth attempts (with redacted credentials), session refreshes, failures
- **Alerting**: High auth failure rate (>10%), repeated token refresh failures

## Technical Considerations

### Key Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **Zustand for token storage** | Project standard per AGENTS.md, SSR-safe with skipHydration | Memory-only; lost on page hard-refresh without loader |
| **Root loader for session restore** | SSR-safe, hydration-safe, centralized | All routes depend on root loader |
| **createServerFn proxy pattern** | Type-safe, SSR-compatible, idiomatic TanStack Start | Requires Vite proxy in dev; 'use at origin' config for prod |
| **SameSite=Lax** | Required for cross-origin login API calls | Reduced CSRF protection vs SameSite=Strict |

### Known Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SSR hydration mismatch | Medium | Root loader sets state before hydration; Zustand uses skipHydration |
| CSRF vulnerability with SameSite=Lax | Low (for V1) | Document limitation; plan CSRF tokens for V2 |
| Token lost on hard refresh without loader | Low | Root loader always runs; fallback to redirect to login |

## Architecture Decision Records

- [ADR-001: Auth Frontend Module V1 Scope](adrs/adr-001.md) — Registration + Login + Protected Routes with basic security controls
- [ADR-002: Access Token Storage](adrs/adr-002.md) — Use Zustand store with client-only middleware
- [ADR-003: Session Restoration via Root Loader](adrs/adr-003.md) — TanStack Router root loader pattern for SSR-safe session restore
- [ADR-004: API Calls via createServerFn Proxy](adrs/adr-004.md) — TanStack createServerFn with Vite proxy for type-safe backend integration