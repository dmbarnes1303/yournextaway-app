import type { ImageSourcePropType } from "react-native";
import { normalizeCityKey } from "@/src/utils/city";

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

const u = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1800&h=3200&fm=jpg&q=82`;

const BACKGROUNDS: Record<BackgroundKey, BackgroundSource> = {
  // Football-first
  home: u("photo-1547347298-4074fc3086f0"),
  fixtures: u("photo-1547347298-4074fc3086f0"),
  match: u("photo-1517927033932-b3d18e61fb3a"),
  stadium: u("photo-1517927033932-b3d18e61fb3a"),
  team: u("photo-1508098682722-e99c643e7485"),
  explore: u("photo-1508098682722-e99c643e7485"),

  // Entry / onboarding
  landing: u("photo-1508098682722-e99c643e7485"),
  "landing-hero": u("photo-1508098682722-e99c643e7485"),
  "onboarding-1": u("photo-1508098682722-e99c643e7485"),
  "onboarding-2": u("photo-1517927033932-b3d18e61fb3a"),
  "onboarding-3": u("photo-1547347298-4074fc3086f0"),
  "onboarding-4": u("photo-1522778119026-d647f0596c20"),

  // Travel / workspace surfaces
  trips: u("photo-1500534314209-a25ddb2bd429"),
  trip: u("photo-1499856871958-5b9627545d1a"),

  // Utility / account surfaces — lighter than before so cards can breathe
  wallet: u("photo-1518544866330-4e48f0f9f9e2"),
  profile: u("photo-1517248135467-4c7edcad34c4"),
  paywall: u("photo-1508098682722-e99c643e7485"),

  // City fallback
  city: u("photo-1499856871958-5b9627545d1a"),
};

export function getBackground(key: BackgroundKey): BackgroundSource {
  return BACKGROUNDS[key];
}

export function getBackgroundSource(key: BackgroundKey): ImageSourcePropType | { uri: string } {
  const src = BACKGROUNDS[key];
  if (typeof src === "string") return { uri: src };
  return src;
}

function unsplashCityFallback(cityKey: string) {
  const q = cityKey.replace(/-/g, " ").trim();
  return `https://source.unsplash.com/featured/1800x3200/?${encodeURIComponent(
    `${q} skyline night city`
  )}`;
}

export const CITY_BACKGROUNDS: Record<string, string> = {
  london: u("photo-1528909514045-2fa4ac7a08ba"),
  manchester: u("photo-1513635269975-59663e0ac1ad"),
  liverpool: u("photo-150576167
