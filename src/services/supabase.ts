import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV, isSupabaseEnvConfigured } from "@/src/config/env";

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseEnvConfigured()) {
  supabaseInstance = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = supabaseInstance;

export function isSupabaseConfigured(): boolean {
  return supabaseInstance !== null;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error(
      "Supabase is not configured. Missing EXPO_PUBLIC_SUPABASE_URL and/or EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return supabaseInstance;
}
