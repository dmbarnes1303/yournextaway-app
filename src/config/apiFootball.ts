// src/config/apiFootball.ts
import Constants from "expo-constants";

export const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

function readKey(): string | undefined {
  // Prefer EXPO_PUBLIC env var (works in Expo). Fallback to app.json extra.
  const envKey = (process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ?? "").trim();
  if (envKey) return envKey;

  const extraKey =
    (Constants?.expoConfig?.extra as any)?.EXPO_PUBLIC_API_FOOTBALL_KEY;
  if (typeof extraKey === "string" && extraKey.trim()) return extraKey.trim();

  return undefined;
}

export function assertApiFootballKey(): string {
  const key = readKey();
  if (!key) {
    throw new Error(
      "Missing API-Football key. Set EXPO_PUBLIC_API_FOOTBALL_KEY (recommended) or app.json extra.EXPO_PUBLIC_API_FOOTBALL_KEY."
    );
  }
  return key;
}
