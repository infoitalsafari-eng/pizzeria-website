import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const ADMIN_USER = import.meta.env.VITE_ADMIN_USER ?? 'admin';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS ?? 'pizzeria2025';

interface AdminAuthState {
  isAdminLoggedIn: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAdminLoggedIn: false,
      login: (user, pass) => {
        if (user === ADMIN_USER && pass === ADMIN_PASS) {
          set({ isAdminLoggedIn: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isAdminLoggedIn: false }),
    }),
    { name: 'admin-auth' }
  )
);
