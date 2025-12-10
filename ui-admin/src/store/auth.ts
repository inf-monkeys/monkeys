import { create } from 'zustand';
import type { AuthState, AdminUser } from '@/types/auth';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  clearStoredToken,
} from '@/apis/auth';

interface AuthStore extends AuthState {
  setUser: (user: AdminUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setToken: (token) =>
    set({
      token,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  login: (token, user) => {
    setStoredToken(token);
    setStoredUser(user);
    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    clearStoredToken();
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  hydrate: () => {
    const token = getStoredToken();
    const user = getStoredUser();

    if (token && user) {
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({
        isLoading: false,
      });
    }
  },
}));
