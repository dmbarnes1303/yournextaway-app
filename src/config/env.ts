import Constants from "expo-constants";

export type Env = {
  backendUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function normalizeUrl(value: unknown): string {
  const raw = clean(value);
  if (!raw) return "";

  try {
    return new URL(raw).toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function pickExtra(): Record<string, unknown> {
  const cfg: any = (Constants as any).expoConfig ?? (Constants as any).manifest;
  return (cfg?.extra ?? {}) as Record<string, unknown>;
}

function getEnvValue(key: string): string {
  const extra = pickExtra();
  return clean(extra[key] ?? process.env[key]);
}

const backendUrl = normalizeUrl(getEnvValue("EXPO_PUBLIC_BACKEND_URL"));
const supabaseUrl = normalizeUrl(getEnvValue("EXPO_PUBLIC_SUPABASE_URL"));
const supabaseAnonKey = getEnvValue("EXPO_PUBLIC_SUPABASE_ANON_KEY");

export const ENV: Env = {
  backendUrl,
  supabaseUrl,
  supabaseAnonKey,
};

export function getBackendBaseUrl(): string {
  return ENV.backendUrl;
}

export function assertBackendBaseUrl(): string {
  if (!ENV.backendUrl) {
    throw new Error("Missing backend URL. Set EXPO_PUBLIC_BACKEND_URL.");
  }

  return ENV.backendUrl;
}

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey);
}
