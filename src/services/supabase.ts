import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl =
  typeof rawSupabaseUrl === "string" && rawSupabaseUrl.trim().length > 0
    ? rawSupabaseUrl.trim()
    : null;

const supabaseAnonKey =
  typeof rawSupabaseAnonKey === "string" && rawSupabaseAnonKey.trim().length > 0
    ? rawSupabaseAnonKey.trim()
    : null;

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
