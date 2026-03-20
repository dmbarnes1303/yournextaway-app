import Constants from "expo-constants";

type Env = {
  backendUrl: string;
  se365ProxyUrl: string;
  se365AffiliateId: string;
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

const se365ProxyUrl = normalizeUrl(
  extra.EXPO_PUBLIC_SE365_PROXY_URL ??
    process.env.EXPO_PUBLIC_SE365_PROXY_URL ??
    backendUrl
);

const se365AffiliateId = clean(
  extra.EXPO_PUBLIC_SE365_AFFILIATE_ID ??
    process.env.EXPO_PUBLIC_SE365_AFFILIATE_ID
);

export const ENV: Env = {
  backendUrl,
  se365ProxyUrl,
  se365AffiliateId,
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
