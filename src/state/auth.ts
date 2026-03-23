import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from "@/src/services/supabase";

type AuthState = {
  booted: boolean;
  session: Session | null;
  user: User | null;

  init: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;

  _unsubscribe?: () => void;
};

const authStore = create<AuthState>((set, get) => ({
  booted: false,
  session: null,
  user: null,
  _unsubscribe: undefined,

  init: async () => {
    const existingUnsub = get()._unsubscribe;
    if (existingUnsub) return;

    if (!isSupabaseConfigured()) {
      set({
        session: null,
        user: null,
        booted: true,
      });
      return;
    }

    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        set({
          session: null,
          user: null,
          booted: true,
        });
        throw error;
      }

      const session = data?.session ?? null;

      set({
        session,
        user: session?.user ?? null,
        booted: true,
      });

      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        set({
          session: next ?? null,
          user: next?.user ?? null,
          booted: true,
        });
      });

      set({
        _unsubscribe: () => {
          sub?.subscription?.unsubscribe();
          set({ _unsubscribe: undefined });
        },
      });
    } catch (error) {
      set({
        session: null,
        user: null,
        booted: true,
      });
      throw error;
    }
  },

  signInWithMagicLink: async (email: string) => {
    const e = String(email ?? "").trim();
    if (!e) throw new Error("Email required.");
    if (!isSupabaseConfigured()) {
      throw new Error(
        "Sign-in is not available because Supabase is not configured."
      );
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: { shouldCreateUser: true },
    });

    if (error) throw error;
  },

  signOut: async () => {
    const { _unsubscribe } = get();
    if (_unsubscribe) _unsubscribe();

    if (!isSupabaseConfigured()) {
      set({
        session: null,
        user: null,
        booted: true,
      });
      return;
    }

    const supabase = getSupabaseClient();
    await supabase.auth.signOut();

    set({
      session: null,
      user: null,
      booted: true,
    });
  },
}));

export default authStore;
