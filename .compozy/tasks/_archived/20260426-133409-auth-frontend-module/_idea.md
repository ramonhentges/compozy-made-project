# Auth Frontend Module

## Overview

A complete authentication frontend module providing user registration, login, and protected route access for general end users. Built with TanStack Start (SSR), shadcn/ui components, React Hook Form, Zod validation, and Tailwind CSS. Uses JWT-based authentication with httpOnly refresh token cookies and memory-stored access tokens.

## Problem

General end users need a secure way to create accounts and access protected content. Without this module, the application has no user authentication — no registration, no login, no session persistence, and no protected routes. Users cannot personalize their experience, and the application cannot track user-specific data or state.

**Current state:** Backend has registration and login endpoints, but no frontend UI exists to consume them. Users cannot register, login, or access protected content.

### Market Data

- **Standard auth pattern**: JWT + httpOnly cookies is the 2025-2026 baseline for React SSR applications (TanStack Start docs, React authentication best practices)
- **Form validation**: React Hook Form + Zod + shadcn Form is the de facto standard for secure, accessible React forms (shadcn documentation, 2026)
- **SSR auth complexity**: Server-driven auth state prevents hydration mismatches and is recommended by TanStack Start for SSR applications

## Core Features

| #   | Feature              | Priority  | Description                                                                 |
| --- | -------------------- | --------- | --------------------------------------------------------------------------- |
| F1  | User Registration    | Critical  | Form with email, password, and name fields. Zod validation, error display. |
| F2  | User Login           | Critical  | Form with email and password. Returns JWT tokens.                           |
| F3  | Session Management   | Critical  | httpOnly cookie for refresh token. Access token in memory.                  |
| F4  | Protected Home Page  | Critical  | Route guard redirecting unauthenticated users to login.                     |
| F5  | Logout               | High      | Clears cookies and redirects to login.                                      |
| F6  | Route Guards         | High      | TanStack Start loader-based auth validation for protected routes.           |

## KPIs

| KPI                        | Target      | How to Measure                                   |
| -------------------------- | ----------- | ------------------------------------------------ |
| Registration success rate  | > 90%       | Successful registrations / form submissions      |
| Login success rate         | > 95%       | Successful logins / form submissions              |
| Auth redirect effectiveness| = 100%      | Unauthenticated users cannot access home page    |
| Form validation coverage   | = 100%      | All client-side validation covered by Zod schema |

## Feature Assessment

| Criteria            | Question                                             | Score        |
| ------------------- | --------------------------------------------------- | ------------ |
| **Impact**          | How much more valuable does this make the product?  | Must do      |
| **Reach**           | What % of users would this affect?                  | Must do      |
| **Frequency**       | How often would users encounter this value?         | Must do      |
| **Differentiation** | Does this set us apart or just match competitors?   | Pass         |
| **Defensibility**   | Is this easy to copy or does it compound over time? | Pass         |
| **Feasibility**     | Can we actually build this?                         | Must do      |

Leverage type: **Quick Win** — foundational infrastructure enabling all user-specific features.

## Council Insights

- **Recommended approach:** Build complete auth flow (registration + login + protected routes) in V1. httpOnly cookie + memory access token pattern provides XSS protection while enabling SSR.
- **Key trade-offs:** SameSite=Lax required for cross-origin login API calls (trade-off with CSRF protection); SSR hydration requires careful session-fetching pattern.
- **Risks identified:**
  - SSR hydration mismatch on auth state — mitigated by fetching session server-side in root loader
  - CSRF vulnerability with SameSite=Lax — documented for V2 CSRF token implementation
- **Stretch goal (V2+):** Add CSRF tokens, email verification, password reset, and social login (OAuth)

## Out of Scope (V1)

- **CSRF token implementation** — SameSite=Strict/Lax provides reasonable CSRF protection for V1. Full CSRF token implementation adds complexity.
- **Email verification** — Requires email delivery infrastructure (SMTP or transactional email service).
- **Password reset** — Requires email delivery and secure token generation flow.
- **Social login (OAuth)** — Adds OAuth provider integration complexity.
- **Session dashboard** — Active sessions list with revoke capability is a security enhancement for V2.

## Architecture Decision Records

- [ADR-001: Auth Frontend Module V1 Scope](adrs/adr-001.md) — Registration + Login + Protected Routes with basic security controls.

## Open Questions

1. **Backend `name` field**: Registration API currently accepts `{email, password}` only. Need to add `name` field to request/response. Confirm: should this be part of this module or a separate backend task?
2. **API base URL**: What is the backend API URL in development/production? Need to configure in frontend environment.
3. **Session refresh**: How should the frontend handle access token refresh before expiry? Background refresh or on-demand only?