// src/config/apiFootball.ts
import Constants from "expo-constants";

export const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

function getExtraKey(): string | undefined {
  const c: any = Constants;

  const candidates = [
    c?.expoConfig?.extra?.EXPO_PUBLIC_API_FOOTBALL_KEY,
    c?.manifest?.extra?.EXPO_PUBLIC_API_FOOTBALL_KEY,
    c?.manifest2?.extra?.EXPO_PUBLIC_API_FOOTBALL_KEY,
  ];

  for (const v of candidates) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function readKey(): string | undefined {
  const envKey = (process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ?? "").trim();
  if (envKey) return envKey;
  return getExtraKey();
}

export function assertApiFootballKey(): string {
  const key = readKey();
  if (!key) {
    throw new Error(
      "Missing API-Football key. Set EXPO_PUBLIC_API_FOOTBALL_KEY."
    );
  }
  return key;
}
