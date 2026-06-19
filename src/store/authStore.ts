import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  login: (email) => set({ isLoggedIn: true, user: { name: email.split('@')[0], email } }),
  logout: () => set({ isLoggedIn: false, user: null }),
}));
