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

function readBackendUrl(): string {
  const extra = pickExtra();

  return normalizeUrl(
    extra.EXPO_PUBLIC_BACKEND_URL ??
      process.env.EXPO_PUBLIC_BACKEND_URL ??
      extra.backendUrl
  );
}

function readSupabaseUrl(): string {
  const extra = pickExtra();

  return normalizeUrl(
    extra.EXPO_PUBLIC_SUPABASE_URL ??
      process.env.EXPO_PUBLIC_SUPABASE_URL ??
      extra.supabaseUrl
  );
}

function readSupabaseAnonKey(): string {
  const extra = pickExtra();

  return clean(
    extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      extra.supabaseAnonKey
  );
}

const backendUrl = readBackendUrl();
const supabaseUrl = readSupabaseUrl();
const supabaseAnonKey = readSupabaseAnonKey();

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
