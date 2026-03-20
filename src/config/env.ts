import Constants from "expo-constants";

type Env = {
  backendUrl: string;
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

const extra = pickExtra();

const backendUrl = normalizeUrl(
  extra.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_BACKEND_URL
);

export const ENV: Env = {
  backendUrl,
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
