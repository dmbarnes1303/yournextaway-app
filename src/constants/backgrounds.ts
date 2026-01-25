// src/constants/backgrounds.ts
import { ImageSourcePropType } from "react-native";

export type BackgroundKey =
  | "landing"
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
 * Centralised background image map.
 * Policy:
 * - Prefer local repo images for consistency (no external drift).
 * - Can mix local + remote if needed, but local is the default.
 */
const BACKGROUNDS: Record<BackgroundKey, ImageSourcePropType> = {
  // Your new local Eiffel Tower background
  landing: require("@/src/eiffeltower.jpeg"),
  home: require("@/src/eiffeltower.jpeg"),

  // Keep existing placeholders for now (we’ll replace each one as you add images)
  fixtures: { uri: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80" },
  build: { uri: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=80" },
  trips: { uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80" },
  city: { uri: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80" },
  team: { uri: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80" },
  wallet: { uri: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80" },
  profile: { uri: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80" },

  onboarding1: require("@/src/eiffeltower.jpeg"),
  onboarding2: { uri: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1600&q=80" },
  onboarding3: { uri: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60b?auto=format&fit=crop&w=1600&q=80" },
};

/**
 * Safe accessor with fallback.
 */
export function getBackground(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUNDS[key] ?? BACKGROUNDS.home;
}

export { BACKGROUNDS };
