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
  // Core football-first surfaces
  home: u("photo-1574629810360-7efbbe195018"), // floodlit stadium / football atmosphere
  fixtures: u("photo-1574629810360-7efbbe195018"), // match list should feel football-first
  match: u("photo-1547347298-4074fc3086f0"), // closer, more intense live-match feel
  stadium: u("photo-1547347298-4074fc3086f0"),
  team: u("photo-1517927033932-b3d18e61fb3a"), // football crowd / stadium energy
  explore: u("photo-1517927033932-b3d18e61fb3a"),

  // Product entry / discovery
  landing: u("photo-1508098682722-e99c643e7485"), // premium night stadium / event feel
  "landing-hero": u("photo-1508098682722-e99c643e7485"),
  "onboarding-1": u("photo-1508098682722-e99c643e7485"),
  "onboarding-2": u("photo-1517927033932-b3d18e61fb3a"),
  "onboarding-3": u("photo-1547347298-4074fc3086f0"),
  "onboarding-4": u("photo-1522778119026-d647f0596c20"), // airport / travel-night tone

  // Travel / planning / account surfaces
  trips: u("photo-1522778119026-d647f0596c20"), // premium night travel / movement
  trip: u("photo-1499092346589-b9b6be3e94b2"), // city-at-night planning workspace feel
  wallet: u("photo-1554224155-6726b3ff858f"), // darker finance / documents vibe
  profile: u("photo-1493246507139-91e8fad9978e"), // understated premium night travel
  paywall: u("photo-1508098682722-e99c643e7485"),

  // City-specific surfaces
  city: u("photo-1499856871958-5b9627545d1a"), // fallback premium city-at-night
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
  // UK
  london: u("photo-1528909514045-2fa4ac7a08ba"),
  manchester: u("photo-1513635269975-59663e0ac1ad"),
  liverpool: u("photo-1505761671935-60b3a7427bad"),
  birmingham: u("photo-1494526585095-c41746248156"),
  newcastle: u("photo-1470004914212-05527e49370b"),
  leeds: u("photo-1494526585095-c41746248156"),
  brighton: u("photo-1507525428034-b723cf961d3e"),
  bournemouth: u("photo-1507525428034-b723cf961d3e"),
  nottingham: u("photo-1470123808288-1e59739a7a31"),
  burnley: u("photo-1473448912268-2022ce9509d8"),
  sunderland: u("photo-1470004914212-05527e49370b"),
  brentford: u("photo-1528909514045-2fa4ac7a08ba"),
  fulham: u("photo-1528909514045-2fa4ac7a08ba"),
  wolverhampton: u("photo-1473448912268-2022ce9509d8"),
  "crystal-palace": u("photo-1528909514045-2fa4ac7a08ba"),

  // Spain
  madrid: u("photo-1539037116277-4db20889f2d4"),
  barcelona: u("photo-1505761671935-60b3a7427bad"),
  valencia: u("photo-1507525428034-b723cf961d3e"),
  seville: u("photo-1505761671935-60b3a7427bad"),
  bilbao: u("photo-1533106418989-88406c7cc8ca"),
  "san-sebastian": u("photo-1533106418989-88406c7cc8ca"),

  // Germany
  munich: u("photo-1467269204594-9661b134dd2b"),
  dortmund: u("photo-1517927033932-b3d18e61fb3a"),
  berlin: u("photo-1526481280695-3c687fd643ed"),

  // Italy
  milan: u("photo-1511818966892-d7d671e672a2"),
  rome: u("photo-1529156069898-49953e39b3ac"),
  naples: u("photo-1529260830199-42c24126f198"),
  turin: u("photo-1516483638261-f4dbaf036963"),

  // France
  paris: u("photo-1502602898657-3e91760cbb34"),
  lyon: u("photo-1529429617124-95b109e86bb8"),
  marseille: u("photo-1529260830199-42c24126f198"),

  // Netherlands / Portugal / others
  amsterdam: u("photo-1512470876302-972faa2aa9a4"),
  lisbon: u("photo-1513735492246-483525079686"),
  porto: u("photo-1555881400-74d7acaacd8b"),
  vienna: u("photo-1516550893923-42d28e5677af"),
  prague: u("photo-1519677100203-a0e668c92439"),
  istanbul: u("photo-1527838832700-5059252407fa"),
  athens: u("photo-1505664194779-8beaceb93744"),
  zagreb: u("photo-1528715471579-d1bcf0ba5e83"),
  glasgow: u("photo-1513635269975-59663e0ac1ad"),
};

export function getCityBackground(cityInput: string): string | ImageSourcePropType {
  const key = normalizeCityKey(cityInput);
  if (!key) return typeof BACKGROUNDS.city === "string" ? BACKGROUNDS.city : "";

  const mapped = CITY_BACKGROUNDS[key];
  if (mapped) return mapped;

  return unsplashCityFallback(key);
}

export default BACKGROUNDS;
