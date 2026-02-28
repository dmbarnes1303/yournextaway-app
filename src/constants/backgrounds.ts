// src/constants/backgrounds.ts
import type { ImageSourcePropType } from "react-native";
import { normalizeCityKey } from "@/src/utils/city";

export type BackgroundKey =
  | "home"
  | "city"
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

  // Safe fallback used by city screens if no remote match exists
  city: require("@/src/assets/backgrounds/home.png"),

  landing: require("@/src/assets/backgrounds/landing-hero.png"),
  "landing-hero": require("@/src/assets/backgrounds/landing-hero.png"),

  "onboarding-1": require("@/src/assets/backgrounds/onboarding-1.png"),
  "onboarding-2": require("@/src/assets/backgrounds/onboarding-2.png"),
  "onboarding-3": require("@/src/assets/backgrounds/onboarding-3.png"),
  "onboarding-4": require("@/src/assets/backgrounds/onboarding-4.png"),

  fixtures: require("@/src/assets/backgrounds/fixtures.png"),
  trips: require("@/src/assets/backgrounds/trips.png"),
  wallet: require("@/src/assets/backgrounds/wallet.png"),

  // If you don’t have a dedicated profile background yet, reuse trips intentionally.
  profile: require("@/src/assets/backgrounds/trips.png"),
};

export function getBackground(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUNDS[key];
}

/**
 * Remote Unsplash helper
 * NOTE: `id` must be an images.unsplash.com path segment, e.g. "photo-123..."
 */
const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&h=3200&fm=jpg&q=80`;

/**
 * CITY HERO BACKGROUNDS
 * Keys MUST match normalizeCityKey() output (lowercase + hyphen-separated).
 */
export const CITY_BACKGROUNDS: Record<string, string> = {
  /* ---------------- PREMIER LEAGUE ---------------- */
  london: u("photo-1528909514045-2fa4ac7a08ba"),
  manchester: u("photo-1505761671935-60b3a7427bad"),
  liverpool: u("photo-1505761671935-60b3a7427bad"),
  birmingham: u("photo-1512453979798-5ea266f8880c"),
  newcastle: u("photo-1500530855697-b586d89ba3ee"),
  leeds: u("photo-1500530855697-b586d89ba3ee"),
  brighton: u("photo-1501854140801-50d01698950b"),
  bournemouth: u("photo-1501854140801-50d01698950b"),
  sheffield: u("photo-1519681393784-d120267933ba"),
  nottingham: u("photo-1470123808288-1e59739a7a31"),
  leicester: u("photo-1544986581-efac024faf62"),
  wolverhampton: u("photo-1519681393784-d120267933ba"),

  /* ---------------- LA LIGA ---------------- */
  madrid: u("photo-1543783207-ec64e4d95325"),
  barcelona: u("photo-1505761671935-60b3a7427bad"),
  valencia: u("photo-1501854140801-50d01698950b"),
  seville: u("photo-1501854140801-50d01698950b"),
  bilbao: u("photo-1533106418989-88406c7cc8ca"),
  "san-sebastian": u("photo-1533106418989-88406c7cc8ca"),
  vigo: u("photo-1501854140801-50d01698950b"),
  mallorca: u("photo-1501854140801-50d01698950b"),
  girona: u("photo-1533106418989-88406c7cc8ca"),
  granada: u("photo-1529260830199-42c24126f198"),
  almeria: u("photo-1529260830199-42c24126f198"),
  getafe: u("photo-1543783207-ec64e4d95325"),

  /* ---------------- BUNDESLIGA ---------------- */
  munich: u("photo-1526481280695-3c687fd643ed"),
  dortmund: u("photo-1500530855697-b586d89ba3ee"),
  berlin: u("photo-1526481280695-3c687fd643ed"),
  hamburg: u("photo-1533106418989-88406c7cc8ca"),
  bremen: u("photo-1533106418989-88406c7cc8ca"),
  cologne: u("photo-1526481280695-3c687fd643ed"),
  frankfurt: u("photo-1500530855697-b586d89ba3ee"),
  stuttgart: u("photo-1526481280695-3c687fd643ed"),
  leipzig: u("photo-1500530855697-b586d89ba3ee"),
  leverkusen: u("photo-1526481280695-3c687fd643ed"),
  augsburg: u("photo-1526481280695-3c687fd643ed"),
  hoffenheim: u("photo-1519681393784-d120267933ba"),
  freiburg: u("photo-1500530855697-b586d89ba3ee"),

  /* ---------------- SERIE A ---------------- */
  milan: u("photo-1526481280695-3c687fd643ed"),
  rome: u("photo-1529156069898-49953e39b3ac"),
  naples: u("photo-1529260830199-42c24126f198"),
  turin: u("photo-1526481280695-3c687fd643ed"),
  florence: u("photo-1526481280695-3c687fd643ed"),
  bologna: u("photo-1549899599-7b5d3b74e6c8"),
  bergamo: u("photo-1512453979798-5ea266f8880c"),
  genoa: u("photo-1533106418989-88406c7cc8ca"),
  verona: u("photo-1526481280695-3c687fd643ed"),
  udine: u("photo-1519681393784-d120267933ba"),
  lecce: u("photo-1529260830199-42c24126f198"),
  cagliari: u("photo-1501854140801-50d01698950b"),
  como: u("photo-1501854140801-50d01698950b"),
  parma: u("photo-1526481280695-3c687fd643ed"),
  pisa: u("photo-1501854140801-50d01698950b"),

  /* ---------------- LIGUE 1 ---------------- */
  paris: u("photo-1502602898657-3e91760cbb34"),
  lyon: u("photo-1529429617124-95b109e86bb8"),
  lille: u("photo-1533106418989-88406c7cc8ca"),
  rennes: u("photo-1589394815804-964ed0be2eb5"),
  strasbourg: u("photo-1551632811-561732d1e306"),
  toulouse: u("photo-1559128010-7c1ad6e1b6a7"),
  nice: u("photo-1505761671935-60b3a7427bad"),
  monaco: u("photo-1505761671935-60b3a7427bad"),
  nantes: u("photo-1519681393784-d120267933ba"),
  metz: u("photo-1544986581-efac024faf62"),
  auxerre: u("photo-1528909514045-2fa4ac7a08ba"),
  brest: u("photo-1520975693411-b0f2f7d1c40b"),
  lorient: u("photo-1520975693411-b0f2f7d1c40b"),
  "le-havre": u("photo-1500530855697-b586d89ba3ee"),
  angers: u("photo-1470123808288-1e59739a7a31"),
};

/**
 * Returns a city hero background:
 * - If we have a remote Unsplash URL for the normalized city key, return that URL string.
 * - Otherwise return a safe local fallback ImageSource.
 */
export function getCityBackground(cityInput: string): string | ImageSourcePropType {
  const key = normalizeCityKey(cityInput);
  if (!key) return BACKGROUNDS.city;
  return CITY_BACKGROUNDS[key] ?? BACKGROUNDS.city;
}

export default BACKGROUNDS;
