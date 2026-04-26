import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

const initialState = {
  accessToken: null,
  user: null,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      ...initialState,
      setAuth: (token, user) => set({ accessToken: token, user }),
      clearAuth: () => set(initialState),
    }),
    { name: 'auth-store' }
  )
);