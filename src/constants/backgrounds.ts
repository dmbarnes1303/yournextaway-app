// src/constants/backgrounds.ts
import type { ImageSourcePropType } from "react-native";
import { normalizeCityKey } from "@/src/utils/city";

/**
 * V2 rule: backgrounds are remote URLs (crisp, contextual, not blurred).
 * We still allow local ImageSourcePropType for backwards compatibility.
 */
export type BackgroundSource = string | ImageSourcePropType;

export type BackgroundKey =
  | "home"
  | "landing"
  | "landing-hero"
  | "onboarding-1"
  | "onboarding-2"
  | "onboarding-3"
  | "onboarding-4"
  | "fixtures"
  | "match"
  | "trips"
  | "trip"
  | "wallet"
  | "profile"
  | "stadium"
  | "team"
  | "city"
  | "explore"
  | "paywall";

/**
 * Curated Unsplash helper (stable photo IDs).
 * (We keep your existing pattern so the app remains consistent.)
 */
const u = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1800&h=3200&fm=jpg&q=80`;

/**
 * Screen backgrounds (V2)
 * Intent: dark graded, high contrast, "night travel + stadium lights" vibe.
 */
const BACKGROUNDS: Record<BackgroundKey, BackgroundSource> = {
  // Hub / general
  home: u("photo-1528909514045-2fa4ac7a08ba"), // London night skyline (dark-friendly)
  landing: u("photo-1505761671935-60b3a7427bad"),
  "landing-hero": u("photo-1505761671935-60b3a7427bad"),

  // Onboarding (keep varied but still dark-friendly)
  "onboarding-1": u("photo-1500530855697-b586d89ba3ee"),
  "onboarding-2": u("photo-1519681393784-d120267933ba"),
  "onboarding-3": u("photo-1526481280695-3c687fd643ed"),
  "onboarding-4": u("photo-1502602898657-3e91760cbb34"),

  // Primary product surfaces
  fixtures: u("photo-1526481280695-3c687fd643ed"), // city/stadium-like atmospheric
  match: u("photo-1526481280695-3c687fd643ed"),
  trips: u("photo-1502602898657-3e91760cbb34"), // travel/city premium
  trip: u("photo-1543783207-ec64e4d95325"), // trip workspace vibe
  wallet: u("photo-1512453979798-5ea266f8880c"), // clean/document-like abstract travel
  profile: u("photo-1519681393784-d120267933ba"),

  // Guides
  stadium: u("photo-1526481280695-3c687fd643ed"),
  team: u("photo-1500530855697-b586d89ba3ee"),
  city: u("photo-1502602898657-3e91760cbb34"),
  explore: u("photo-1543783207-ec64e4d95325"),

  // Monetisation
  paywall: u("photo-1505761671935-60b3a7427bad"),
};

export function getBackground(key: BackgroundKey): BackgroundSource {
  return BACKGROUNDS[key];
}

/**
 * For components expecting an Image source object.
 */
export function getBackgroundSource(key: BackgroundKey): ImageSourcePropType | { uri: string } {
  const src = BACKGROUNDS[key];
  if (typeof src === "string") return { uri: src };
  return src;
}

/**
 * Automatic city background fallback (no keys required).
 * NOTE: Not guaranteed stable, but gives "something relevant" if not curated.
 */
function unsplashCityFallback(cityKey: string) {
  const q = cityKey.replace(/-/g, " ").trim();
  return `https://source.unsplash.com/featured/1800x3200/?${encodeURIComponent(
    q + " night skyline"
  )}`;
}

/**
 * CITY HERO BACKGROUNDS
 * Keys MUST match normalizeCityKey() output (kebab-case).
 * Add to this list for stable, curated picks.
 */
export const CITY_BACKGROUNDS: Record<string, string> = {
  // UK
  london: u("photo-1528909514045-2fa4ac7a08ba"),
  manchester: u("photo-1505761671935-60b3a7427bad"),
  liverpool: u("photo-1505761671935-60b3a7427bad"),
  birmingham: u("photo-1512453979798-5ea266f8880c"),
  newcastle: u("photo-1500530855697-b586d89ba3ee"),
  leeds: u("photo-1500530855697-b586d89ba3ee"),
  brighton: u("photo-1501854140801-50d01698950b"),
  bournemouth: u("photo-1501854140801-50d01698950b"),
  nottingham: u("photo-1470123808288-1e59739a7a31"),
  burnley: u("photo-1519681393784-d120267933ba"),
  sunderland: u("photo-1500530855697-b586d89ba3ee"),
  brentford: u("photo-1528909514045-2fa4ac7a08ba"),
  fulham: u("photo-1528909514045-2fa4ac7a08ba"),
  wolverhampton: u("photo-1519681393784-d120267933ba"),
  "crystal-palace": u("photo-1528909514045-2fa4ac7a08ba"),

  // Spain
  madrid: u("photo-1543783207-ec64e4d95325"),
  barcelona: u("photo-1505761671935-60b3a7427bad"),
  valencia: u("photo-1501854140801-50d01698950b"),
  seville: u("photo-1501854140801-50d01698950b"),
  bilbao: u("photo-1533106418989-88406c7cc8ca"),
  "san-sebastian": u("photo-1533106418989-88406c7cc8ca"),

  // Germany
  munich: u("photo-1526481280695-3c687fd643ed"),
  dortmund: u("photo-1500530855697-b586d89ba3ee"),
  berlin: u("photo-1526481280695-3c687fd643ed"),

  // Italy
  milan: u("photo-1526481280695-3c687fd643ed"),
  rome: u("photo-1529156069898-49953e39b3ac"),
  naples: u("photo-1529260830199-42c24126f198"),
  turin: u("photo-1526481280695-3c687fd643ed"),

  // France
  paris: u("photo-1502602898657-3e91760cbb34"),
  lyon: u("photo-1529429617124-95b109e86bb8"),
  marseille: u("photo-1529260830199-42c24126f198"),
};

export function getCityBackground(cityInput: string): string | ImageSourcePropType {
  const key = normalizeCityKey(cityInput);
  if (!key) return typeof BACKGROUNDS.home === "string" ? BACKGROUNDS.home : "";

  const mapped = CITY_BACKGROUNDS[key];
  if (mapped) return mapped;

  return unsplashCityFallback(key);
}

export default BACKGROUNDS;
