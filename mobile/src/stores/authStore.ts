import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserRole, UserRow } from '../types/database';

interface AuthState {
  session: Session | null;
  profile: UserRow | null;
  initializing: boolean;
  error: string | null;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initializing: true,
  error: null,

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, initializing: false });
      if (data.session) get().refreshProfile();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, initializing: false });
      if (session) {
        get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });

    return () => sub.subscription.unsubscribe();
  },

  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!error) set({ profile: data });
  },

  signIn: async (email, password) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    return { error: null };
  },

  signUp: async ({ email, password, fullName, role }) => {
    set({ error: null });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
