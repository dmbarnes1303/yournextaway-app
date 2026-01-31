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
  | "onboarding3"
  | "onboarding4";

/**
 * Local assets:
 * - landing + home + onboarding 1..4 are local files in src/assets/backgrounds
 * Remote assets:
 * - everything else can stay remote for now
 */
const BACKGROUND_SOURCES: Record<BackgroundKey, ImageSourcePropType> = {
  // Local
  landing: require("@/src/assets/backgrounds/landing-hero.png"),
  home: require("@/src/assets/backgrounds/home.png"),
  onboarding1: require("@/src/assets/backgrounds/onboarding-1.png"),
  onboarding2: require("@/src/assets/backgrounds/onboarding-2.png"),
  onboarding3: require("@/src/assets/backgrounds/onboarding-3.png"),
  onboarding4: require("@/src/assets/backgrounds/onboarding-4.png"),

  // Remote (unchanged defaults)
  fixtures: {
    uri: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80",
  },
  build: {
    uri: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=80",
  },
  trips: {
    uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },
  city: {
    uri: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
  },
  team: {
    uri: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
  },
  wallet: {
    uri: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
  },
  profile: {
    uri: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80",
  },
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
