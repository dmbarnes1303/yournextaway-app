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
 * Remote-only backgrounds (single policy).
 * Use direct Unsplash URLs with sizing params for predictable performance.
 */
const BACKGROUND_URLS: Record<BackgroundKey, string> = {
  home: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
  fixtures: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80",
  build: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=80",
  trips: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  city: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
  team: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
  wallet: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
  profile: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  onboarding1: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1600&q=80",
  onboarding2: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1600&q=80",
  onboarding3: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60b?auto=format&fit=crop&w=1600&q=80",
};

/**
 * Backwards-compatible accessor: returns URL string.
 * Use where you still pass imageUrl="https://..."
 */
export function getBackground(key: BackgroundKey): string {
  return BACKGROUND_URLS[key] ?? BACKGROUND_URLS.home;
}

/**
 * Preferred accessor: returns ImageSourcePropType for Background imageSource.
 * Remote-only per project policy.
 */
export function getBackgroundSource(key: BackgroundKey): ImageSourcePropType {
  return { uri: getBackground(key) };
}

export { BACKGROUND_URLS };
