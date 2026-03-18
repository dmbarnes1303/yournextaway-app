import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const supabaseUrl = getEnv("EXPO_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = getEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY");

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = supabaseInstance;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseInstance);
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error(
      "Supabase is not configured. Missing EXPO_PUBLIC_SUPABASE_URL and/or EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return supabaseInstance;
}
