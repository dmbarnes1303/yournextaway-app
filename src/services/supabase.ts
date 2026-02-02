// src/services/supabase.ts
import { createClient } from "@supabase/supabase-js";

function mustEnv(name: string) {
  const v = (process.env as any)?.[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return String(v);
}

export const supabase = createClient(
  mustEnv("EXPO_PUBLIC_SUPABASE_URL"),
  mustEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
