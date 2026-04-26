# Auth Frontend Module PRD

## Overview

A complete authentication frontend module providing user registration, login, session management, and protected route access for general end users. Built with TanStack Start (SSR), React Hook Form, Zod validation, and Tailwind CSS. Uses JWT-based authentication with httpOnly refresh token cookies and memory-stored access tokens.

This module solves the fundamental problem that the application has no frontend authentication — users cannot register, login, or access protected content. Backend has full auth infrastructure (registration, login, JWT tokens), but no frontend UI exists to consume it.

## Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| Registration success rate | > 90% | Successful registrations / form submissions |
| Login success rate | > 95% | Successful logins / form submissions |
| Auth redirect effectiveness | = 100% | Unauthenticated users cannot access protected routes |
| Form validation coverage | = 100% | All client-side validation covered by Zod schema |

## User Stories

### Primary Persona: New User

- **As a new user, I want to register an account with my email, name, and password so that I can create a personalized account and access the application.**
  - Register form with email, name, password fields
  - Email validation (format, uniqueness check)
  - Password strength requirements
  - Success redirect to login or auto-login

- **As a registered user, I want to log in with my email and password so that I can access my personalized content.**
  - Login form with email, password
  - JWT token response handling
  - Session persistence across page refreshes
  - Redirect to protected page on success

### Secondary Persona: Authenticated User

- **As an authenticated user, I want to log out so that I can securely end my session on shared devices.**
  - Logout clears cookies and memory
  - Redirect to login page
  - Session invalidation

- **As an authenticated user, I want to access protected content without re-authenticating on every page refresh so that I have a seamless experience.**
  - Session restoration on page refresh
  - Access token refresh on 401
  - Auth state consistency across navigation

## Core Features

### F1: User Registration (Critical)

- **Description**: Form with email, name, password fields and Zod validation
- **Fields**: email (required, valid format), name (required, 2-100 chars), password (required, min 8 chars)
- **Behavior**: 
  - Client-side Zod validation before submit
  - API call to POST /register
  - Show validation errors inline
  - Handle "email already registered" error
  - Success: redirect to login with success message

### F2: User Login (Critical)

- **Description**: Form with email and password fields returning JWT tokens
- **Fields**: email (required, valid format), password (required)
- **Behavior**:
  - Client-side validation
  - API call to POST /login
  - Store access token in memory (sessionStorage or component state)
  - Backend sets httpOnly refresh token cookie
  - Redirect to protected page on success

### F3: Session Management (Critical)

- **Description**: httpOnly cookie for refresh token, access token in memory
- **Behavior**:
  - Refresh token in httpOnly cookie (set by backend on login)
  - Access token stored in memory (not localStorage — prevents XSS theft)
  - On page load: check cookie, get fresh access token
  - On 401: attempt token refresh, logout if failed
  - No proactive refresh (on-demand only)

### F4: Protected Route / Home Page (Critical)

- **Description**: Route guard redirecting unauthenticated users to login
- **Behavior**:
  - Home page requires authentication
  - TanStack Router loader validates session
  - Unauthenticated users redirect to /login
  - Return URL param for post-login redirect

### F5: Logout (High)

- **Description**: Clears cookies and redirects to login
- **Behavior**:
  - Call logout API endpoint
  - Clear access token from memory
  - Redirect to /login

### F6: Route Guards (High)

- **Description**: TanStack Start loader-based auth validation for protected routes
- **Behavior**:
  - Middleware/loader validates session before route loads
  - Shared auth check logic reusable across routes
  - Support route-specific access control for future RBAC

## User Experience

### Registration Flow

1. User navigates to /register
2. Fills email, name, password fields
3. Real-time validation feedback on blur
4. Submits form
5. Success: redirect to /login with "Registration successful" message
6. Error: display inline error message

### Login Flow

1. User navigates to /login (or redirected from protected route)
2. Fills email, password fields
3. Submits form
4. Backend sets httpOnly refresh token cookie
5. Returns access token in response
6. Access token stored in memory
7. Redirect to protected page (or returnUrl param)

### Session Restoration

1. User refreshes page or navigates to protected route
2. Loader checks for refresh token cookie
3. If cookie exists, call token refresh endpoint
4. Get fresh access token
5. Load protected content

### Logout Flow

1. User clicks "Logout" button
2. Call /logout API endpoint
3. Clear access token from memory
4. Redirect to /login

## High-Level Technical Constraints

- **Backend API**: Calls existing backend auth endpoints at {API_URL}/register, {API_URL}/login, {API_URL}/logout
- **Environment**: API_URL configured via environment variable (VITE_API_URL)
- **Security**:
  - Access token in memory only — never localStorage
  - httpOnly cookies for refresh token (backend sets)
  - Generic error messages (no "wrong password" specifics)
  - SameSite=Lax for cross-origin compatibility
- **SSR**: Auth state fetched server-side to prevent hydration mismatch

## Non-Goals (Out of Scope)

- **CSRF token implementation**: SameSite=Lax provides reasonable CSRF protection for V1; full CSRF token implementation deferred to V2
- **Email verification**: Requires email delivery infrastructure (SMTP or transactional email service)
- **Password reset**: Requires email delivery and secure token generation flow
- **Social login (OAuth)**: Adds OAuth provider integration complexity
- **Session dashboard**: Active sessions list with revoke capability deferred to V2
- **Proactive token refresh**: On-demand only for V1

## Phased Rollout Plan

### MVP (Phase 1)

- User registration form with email, name, password
- User login form
- httpOnly cookie + memory access token pattern
- Protected home page with route guard
- Logout functionality
- **Success criteria**: Users can register, login, access protected content, logout

### Phase 2

- CSRF token implementation
- Session dashboard (active sessions)
- Password reset flow
- Email verification

### Phase 3

- Social login (OAuth providers)
- MFA support
- SSO integration

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Registration conversion | > 90% | Registrations / form views |
| Login conversion | > 95% | Logins / form views |
| Auth redirect coverage | = 100% | All protected routes guarded |
| Form validation coverage | = 100% | All fields validated by Zod |

## Risks and Mitigations

- **Adoption**: Users may not complete registration — mitigate with clear error messages and password strength feedback
- **Credential reuse**: Users may reuse passwords — mitigate with password strength requirements
- **Session expiry**: Users may lose session unexpectedly — clear messaging on session expiry

## Architecture Decision Records

- [ADR-001: Auth Frontend Module V1 Scope](adrs/adr-001.md) — Registration + Login + Protected Routes with basic security controls

## Open Questions

All open questions have been resolved through clarification:

1. **Backend name field**: Included in this module — registration form includes name field
2. **API base URL**: Using environment variable VITE_API_URL
3. **Token refresh**: On-demand only — refresh on 401, not proactively