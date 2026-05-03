import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  Link,
  redirect,
  RouterProvider,
} from "@tanstack/react-router";
import { z } from "zod";
import { RegisterPage } from "./routes/register";
import { LoginPage } from "./routes/login";
import { HomePage, homeLoader } from "./routes/home";
import { SessionsPage } from "./routes/sessions";
import type { User } from "./stores/auth.store";
import { useAuthStore } from "./stores/auth.store";
import { isTokenExpired } from "./lib/jwt";
import { refreshFn } from "./api/auth.functions";

export const loginSearchSchema = z.object({
  message: z.string().optional(),
  redirect: z.string().optional(),
});

export function requireUnauthGuard() {
  const authState = useAuthStore.getState();
  if (authState.accessToken) {
    throw redirect({ to: "/home" });
  }
}

export function requireAuthGuard({
  location,
}: {
  location: { pathname: string };
}) {
  const authState = useAuthStore.getState();
  if (!authState.accessToken || !authState.user) {
    throw redirect({ to: "/login", search: { redirect: location.pathname } });
  }
}

export interface AuthLoaderData {
  accessToken: string | null;
  user: User | null;
}

async function loadAuthSession(): Promise<AuthLoaderData> {
  const authState = useAuthStore.getState();
  if (authState.accessToken && !isTokenExpired(authState.accessToken)) {
    return { accessToken: authState.accessToken, user: authState.user };
  }

  try {
    const data = await refreshFn();
    return { accessToken: data.accessToken, user: data.user };
  } catch {
    return { accessToken: null, user: null };
  }
}

export function RootLayout() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = !!accessToken;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            <Link to="/">Compozy</Link>
          </h1>
          <nav className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/home"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  to="/sessions"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sessions
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function IndexPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome</h2>
      <p className="text-gray-600">
        Welcome to Compozy. Please login or register.
      </p>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  beforeLoad: async () => {
    const authData = await loadAuthSession();
    if (authData.accessToken && authData.user) {
      useAuthStore.getState().setAuth(authData.accessToken, authData.user);
    }
    return authData;
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: requireUnauthGuard,
  component: IndexPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "register",
  beforeLoad: requireUnauthGuard,
  component: RegisterPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "login",
  validateSearch: loginSearchSchema,
  beforeLoad: requireUnauthGuard,
  component: LoginPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "home",
  beforeLoad: async ({ location }) => {
    const authState = useAuthStore.getState();
    if (!authState.accessToken || !authState.user) {
      throw redirect({ to: "/login", search: { redirect: location.pathname } });
    }
  },
  loader: homeLoader,
  component: HomePage,
});

const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "sessions",
  beforeLoad: async ({ location }) => {
    const authState = useAuthStore.getState();
    if (!authState.accessToken || !authState.user) {
      throw redirect({ to: "/login", search: { redirect: location.pathname } });
    }
  },
  component: SessionsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  registerRoute,
  loginRoute,
  homeRoute,
  sessionsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { router, RouterProvider, loadAuthSession };
