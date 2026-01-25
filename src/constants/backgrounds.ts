// src/constants/backgrounds.ts
import type { ImageSourcePropType } from "react-native";

export type BackgroundKey =
  | "home"
  | "fixtures"
  | "build"
  | "trips"
  | "city"
  | "team"
  | "wallet"
  | "profile"
  | "onboarding1"
  | "onboarding2"
  | "onboarding3";

/**
 * Legacy URL map (kept for backwards compatibility).
 * Some screens may still call getBackground() and pass a URL string into Background as imageUrl.
 */
const BACKGROUND_URLS: Record<BackgroundKey, string> = {
  home: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
  fixtures: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2",
  build: "https://images.unsplash.com/photo-1529070538774-1843cb3265df",
  trips: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  city: "https://images.unsplash.com/photo-1494526585095-c41746248156",
  team: "https://images.unsplash.com/photo-1546519638-68e109498ffc",
  wallet: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  profile: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
  onboarding1: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
  onboarding2: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325",
  onboarding3: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60b",
};

/**
 * Local overrides (GitHub assets).
 * Add/replace keys here as you commit more backgrounds.
 */
const LOCAL_OVERRIDES: Partial<Record<BackgroundKey, ImageSourcePropType>> = {
  home: require("@/src/eiffeltower.jpeg"),
  onboarding1: require("@/src/eiffeltower.jpeg"),
  onboarding2: require("@/src/eiffeltower.jpeg"),
  onboarding3: require("@/src/eiffeltower.jpeg"),
};

/**
 * Backwards-compatible accessor: returns URL string.
 * Use only where you still pass imageUrl="https://..."
 */
export function getBackground(key: BackgroundKey): string {
  return BACKGROUND_URLS[key] ?? BACKGROUND_URLS.home;
}

/**
 * Preferred accessor: returns ImageSourcePropType.
 * Works for BOTH local require() and remote { uri } images.
 */
export function getBackgroundSource(key: BackgroundKey): ImageSourcePropType {
  return LOCAL_OVERRIDES[key] ?? { uri: getBackground(key) };
}

export { BACKGROUND_URLS, LOCAL_OVERRIDES };
