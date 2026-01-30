// src/constants/backgrounds.ts
import type { ImageSourcePropType } from "react-native";

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
 * Mix allowed ONLY because your landing hero is private.
 * - landing uses local asset
 * - everything else can stay remote
 *
 * If you later host the landing image, replace landing with a URL and delete the require.
 */
const BACKGROUND_SOURCES: Record<BackgroundKey, ImageSourcePropType> = {
  landing: require("@/src/landing-hero.png"),

  home: { uri: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80" },
  fixtures: { uri: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80" },
  build: { uri: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=80" },
  trips: { uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80" },
  city: { uri: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80" },
  team: { uri: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80" },
  wallet: { uri: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80" },
  profile: { uri: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80" },

  onboarding1: { uri: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1600&q=80" },
  onboarding2: { uri: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1600&q=80" },
  onboarding3: { uri: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60b?auto=format&fit=crop&w=1600&q=80" },
};

export function getBackgroundSource(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUND_SOURCES[key] ?? BACKGROUND_SOURCES.home;
}

// Back-compat: returns URL only when it's a uri source
export function getBackground(key: BackgroundKey): string {
  const src = getBackgroundSource(key) as any;
  return typeof src?.uri === "string" ? src.uri : "";
}

export { BACKGROUND_SOURCES };
