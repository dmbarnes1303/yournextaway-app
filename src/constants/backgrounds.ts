// src/constants/backgrounds.ts

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
 * Centralised remote background image map.
 * All images are high-res Unsplash photos.
 * Dark, cinematic, low clutter.
 */
const BACKGROUNDS: Record<BackgroundKey, string> = {
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
 * Safe accessor with fallback.
 */
export function getBackground(key: BackgroundKey): string {
  return BACKGROUNDS[key] ?? BACKGROUNDS.home;
}

export { BACKGROUNDS };
