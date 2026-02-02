// src/state/auth.ts
import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/src/services/supabase";

type AuthState = {
  booted: boolean;
  session: Session | null;
  user: User | null;

  init: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const authStore = create<AuthState>((set, get) => ({
  booted: false,
  session: null,
  user: null,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;
    set({ session, user: session?.user ?? null, booted: true });

    supabase.auth.onAuthStateChange((_event, next) => {
      set({ session: next ?? null, user: next?.user ?? null, booted: true });
    });
  },

  signInWithMagicLink: async (email: string) => {
    const e = String(email ?? "").trim();
    if (!e) throw new Error("Email required.");

    // Expo deep link: keep it simple and stable.
    // Later you can pass a proper redirectTo when you add a scheme.
    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));

export default authStore;
