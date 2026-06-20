import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthState {
  session: Session | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>()((set) => ({
  session: null,
  loading: true,
  setSession: (session) => set({ session, loading: false }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, loading: false });
  },
}));

supabase.auth.getSession().then(({ data: { session } }) => {
  useAdminAuthStore.getState().setSession(session);
});

supabase.auth.onAuthStateChange((_event, session) => {
  useAdminAuthStore.getState().setSession(session);
});
