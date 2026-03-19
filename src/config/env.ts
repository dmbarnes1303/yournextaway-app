// src/config/env.ts
import Constants from "expo-constants";

type Env = {
  backendUrl: string;
  se365ProxyUrl: string;
  se365AffiliateId: string;
};

function pickExtra(): any {
  const cfg: any = (Constants as any).expoConfig ?? (Constants as any).manifest;
  return cfg?.extra ?? {};
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

const extra = pickExtra();

const backendUrl =
  str(extra.EXPO_PUBLIC_BACKEND_URL) ||
  str(process.env.EXPO_PUBLIC_BACKEND_URL) ||
  str((process.env as any)?.EXPO_PUBLIC_BACKEND_BASE_URL);

const se365ProxyUrl =
  str(extra.EXPO_PUBLIC_SE365_PROXY_URL) ||
  str(process.env.EXPO_PUBLIC_SE365_PROXY_URL) ||
  backendUrl;

const se365AffiliateId =
  str(extra.EXPO_PUBLIC_SE365_AFFILIATE_ID) ||
  str(process.env.EXPO_PUBLIC_SE365_AFFILIATE_ID);

export const ENV: Env = {
  backendUrl,
  se365ProxyUrl,
  se365AffiliateId,
};
