// src/constants/backgrounds.ts
import type { ImageSourcePropType } from "react-native";

export type BackgroundKey =
  | "home"
  | "landing"
  | "landing-hero"
  | "onboarding-1"
  | "onboarding-2"
  | "onboarding-3"
  | "onboarding-4"
  | "fixtures"
  | "trips"
  | "wallet"
  | "profile";

const BACKGROUNDS: Record<BackgroundKey, ImageSourcePropType> = {
  home: require("@/src/assets/backgrounds/home.png"),

  // Support both keys so older screens don't explode
  landing: require("@/src/assets/backgrounds/landing-hero.png"),
  "landing-hero": require("@/src/assets/backgrounds/landing-hero.png"),

  "onboarding-1": require("@/src/assets/backgrounds/onboarding-1.png"),
  "onboarding-2": require("@/src/assets/backgrounds/onboarding-2.png"),
  "onboarding-3": require("@/src/assets/backgrounds/onboarding-3.png"),
  "onboarding-4": require("@/src/assets/backgrounds/onboarding-4.png"),

  fixtures: require("@/src/assets/backgrounds/fixtures.png"),
  trips: require("@/src/assets/backgrounds/trips.png"),
  wallet: require("@/src/assets/backgrounds/wallet.png"),

  // PROFILE: calmer, less busy than the current profile art
  profile: require("@/src/assets/backgrounds/trips.png"),
};

/** Preferred name */
export function getBackground(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUNDS[key];
}

/** Backwards-compatible name */
export function getBackgroundSource(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUNDS[key];
}

/**
 * City-level hero backgrounds are NOT part of BackgroundKey.
 * Reason: you do not want 40–200 city keys bloating global app screen backgrounds.
 *
 * We store remote image URLs (per your rule: remote URLs, not local assets).
 * These are direct images.unsplash.com links with jpg output for predictable results.
 */
export type CityBackground = string;

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&h=3200&fm=jpg&q=80`;

/**
 * Keys must match normalizeCityKey output (lowercase, hyphen/space normalized).
 * Keep this list minimal at first — add cities as you ship guides.
 */
export const CITY_BACKGROUNDS: Record<string, CityBackground> = {
  // Ligue 1 (examples)
  paris: u("photo-1502602898657-3e91760cbb34"),
  lyon: u("photo-1529429617124-95b109e86bb8"),
  lille: u("photo-1533106418989-88406c7cc8ca"),
  rennes: u("photo-1589394815804-964ed0be2eb5"),
  strasbourg: u("photo-1551632811-561732d1e306"),
  toulouse: u("photo-1559128010-7c1ad6e1b6a7"),
  nice: u("photo-1505761671935-60b3a7427bad"),
  monaco: u("photo-1505761671935-60b3a7427bad"), // fallback-ish; replace with Monaco-specific later
  nantes: u("photo-1519681393784-d120267933ba"),
  metz: u("photo-1544986581-efac024faf62"),
  auxerre: u("photo-1528909514045-2fa4ac7a08ba"),
  brest: u("photo-1520975693411-b0f2f7d1c40b"),
  lorient: u("photo-1520975693411-b0f2f7d1c40b"),
  lehavre: u("photo-1500530855697-b586d89ba3ee"),
  angers: u("photo-1470123808288-1e59739a7a31"),

  // Serie A (examples – add properly as you expand)
  milan: u("photo-1526481280695-3c687fd643ed"),
  rome: u("photo-1529156069898-49953e39b3ac"),
  naples: u("photo-1529260830199-42c24126f198"),
  turin: u("photo-1526481280695-3c687fd643ed"),
  como: u("photo-1501854140801-50d01698950b"),
  bergamo: u("photo-1512453979798-5ea266f8880c"),
  bologna: u("photo-1549899599-7b5d3b74e6c8"),
  florence: u("photo-1526481280695-3c687fd643ed"),
  verona: u("photo-1526481280695-3c687fd643ed"),
  pisa: u("photo-1501854140801-50d01698950b"),
};

/**
 * Return a city-specific background image URL when known;
 * otherwise fall back to the generic home background asset.
 */
export function getCityBackground(cityKey: string): CityBackground | ImageSourcePropType {
  const key = String(cityKey || "").trim().toLowerCase();
  if (!key) return BACKGROUNDS.home;
  return CITY_BACKGROUNDS[key] ?? BACKGROUNDS.home;
}

export default BACKGROUNDS;
