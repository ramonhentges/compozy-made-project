import { redirect, useLoaderData, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import type { User } from '@/stores/auth.store';
import { useAuthStore } from '@/stores/auth.store';
import { logoutFn } from '@/api/auth.functions';
import { Button } from '@/components/ui/button';

interface HomeLoaderData {
  user: User;
}

export async function homeLoader() {
  try {
    const response = await fetch('/api/token/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw redirect({ to: '/login' });
    }

    const data = await response.json() as { user: User };
    return { user: data.user };
  } catch {
    throw redirect({ to: '/login' });
  }
}

export function HomePage() {
  const data = useLoaderData({ from: '/home' }) as HomeLoaderData;
  const user = data?.user;
  const navigate = useNavigate();

  const onLogout = useCallback(async () => {
    try {
      await logoutFn();
    } catch {
      // Proceed with logout even if API call fails
    }
    useAuthStore.getState().clearAuth();
    navigate({ to: '/login', replace: true });
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <Button variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </div>
      
      {user ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            Welcome back, <span className="font-medium text-gray-900">{user.name}</span>!
          </p>
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Account Details</h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="text-sm text-gray-500 w-24">Email:</dt>
                <dd className="text-sm text-gray-900">{user.email}</dd>
              </div>
              <div className="flex">
                <dt className="text-sm text-gray-500 w-24">Name:</dt>
                <dd className="text-sm text-gray-900">{user.name}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Loading user information...</p>
      )}
    </div>
  );
}

export default HomePage;