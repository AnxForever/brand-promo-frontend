import { create } from 'zustand';
import { authApi } from '../api';

interface UserInfo {
  username: string;
  role: string;
  token: string;
}

interface AuthState {
  user: UserInfo | null;
  isLoggedIn: boolean;
  initialized: boolean;
  login: (user: UserInfo) => void;
  logout: () => void;
  validateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Restore from localStorage
  const stored = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const initialUser = stored && token ? JSON.parse(stored) : null;

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isLoggedIn: false, initialized: true });
  };

  return {
    user: initialUser,
    isLoggedIn: !!initialUser,
    initialized: false,

    login: (user: UserInfo) => {
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoggedIn: true, initialized: true });
    },

    logout: clearAuth,

    validateSession: async () => {
      if (!token || !initialUser) {
        set({ initialized: true });
        return;
      }

      try {
        const res = await authApi.getMe();
        if (!res.success || !res.data) {
          clearAuth();
          return;
        }

        const nextUser: UserInfo = {
          username: res.data.username,
          role: res.data.role,
          token,
        };

        localStorage.setItem('user', JSON.stringify(nextUser));
        set({ user: nextUser, isLoggedIn: true, initialized: true });
      } catch {
        clearAuth();
      }
    },
  };
});
