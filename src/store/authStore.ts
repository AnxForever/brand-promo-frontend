import { create } from 'zustand';

interface UserInfo {
  username: string;
  role: string;
  token: string;
}

interface AuthState {
  user: UserInfo | null;
  isLoggedIn: boolean;
  login: (user: UserInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Restore from localStorage
  const stored = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const initialUser = stored && token ? JSON.parse(stored) : null;

  return {
    user: initialUser,
    isLoggedIn: !!initialUser,

    login: (user: UserInfo) => {
      localStorage.setItem('token', user.token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoggedIn: true });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, isLoggedIn: false });
    },
  };
});
