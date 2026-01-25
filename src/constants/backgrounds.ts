// src/constants/backgrounds.ts

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
 * Unsplash helper:
 * Forces consistent sizing + compression so backgrounds look the same across devices,
 * and avoids "random" crops/tones.
 */
function u(url: string): string {
  const hasQuery = url.includes("?");
  const params = "auto=format&fit=crop&w=1800&q=85";
  return hasQuery ? `${url}&${params}` : `${url}?${params}`;
}

/**
 * Centralised remote background image map.
 * Dark, cinematic, low clutter.
 * IMPORTANT: Avoid blue-heavy night city photos (they turn the whole UI blue through glass).
 */
const BACKGROUNDS: Record<BackgroundKey, string> = {
  // Landing should be the most "brand" and least blue. Use a darker stadium/travel image.
  landing: u("https://images.unsplash.com/photo-1540747913346-19e32dc3e97e"),

  // Home: keep it iconic but avoid cool/blue dominance.
  home: u("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"),

  fixtures: u("https://images.unsplash.com/photo-1546519638-68e109498ffc"),

  build: u("https://images.unsplash.com/photo-1529070538774-1843cb3265df"),

  trips: u("https://images.unsplash.com/photo-1494526585095-c41746248156"),

  city: u("https://images.unsplash.com/photo-1449824913935-59a10b8d2000"),

  team: u("https://images.unsplash.com/photo-1521412644187-c49fa049e84d"),

  wallet: u("https://images.unsplash.com/photo-1526304640581-d334cdbbf45e"),

  profile: u("https://images.unsplash.com/photo-1500534314209-a25ddb2bd429"),

  onboarding1: u("https://images.unsplash.com/photo-1518091043644-c1d4457512c6"),

  onboarding2: u("https://images.unsplash.com/photo-1520975958225-3f61d0a2d6c2"),

  onboarding3: u("https://images.unsplash.com/photo-1505765050516-f72dcac9c60b"),
};

/**
 * Safe accessor with fallback.
 */
export function getBackground(key: BackgroundKey): string {
  return BACKGROUNDS[key] ?? BACKGROUNDS.home;
}

export { BACKGROUNDS };
