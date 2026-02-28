// src/config/env.ts
import Constants from "expo-constants";

type Env = {
  // Sportsevents365
  se365BaseUrl: string;       // e.g. https://api-v2.sandbox365.com OR https://api-v2.sportsevents365.com
  se365ApiKey: string;        // your API key
  se365AffiliateId: string;   // just the code/id, NOT a URL
};

function pickExtra(): any {
  // Expo Go + builds: prefer expoConfig.extra
  const cfg: any = (Constants as any).expoConfig ?? (Constants as any).manifest;
  return cfg?.extra ?? {};
}

function str(v: any): string {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

const extra = pickExtra();

// NOTE: In Expo, EXPO_PUBLIC_* vars are usually surfaced into `extra`
// depending on your setup (app.config / eas.json). We support both.
const se365BaseUrl =
  str(extra.EXPO_PUBLIC_SE365_BASE_URL) ||
  str(process.env.EXPO_PUBLIC_SE365_BASE_URL) ||
  "https://api-v2.sandbox365.com";

const se365ApiKey =
  str(extra.EXPO_PUBLIC_SE365_API_KEY) ||
  str(process.env.EXPO_PUBLIC_SE365_API_KEY);

const se365AffiliateId =
  str(extra.EXPO_PUBLIC_SE365_AFFILIATE_ID) ||
  str(process.env.EXPO_PUBLIC_SE365_AFFILIATE_ID);

export const ENV: Env = {
  se365BaseUrl,
  se365ApiKey,
  se365AffiliateId,
};
