import type { ImageSourcePropType } from "react-native";
import { normalizeCityKey } from "@/src/utils/city";

export type BackgroundAccent = "green" | "blue" | "neutral" | "mixed";

export type BackgroundSpec = {
  kind: "spec";
  accent: BackgroundAccent;
  colors: [string, string, string];
  topTintColor: string;
  topTintOpacity?: number;
  focalTintColor?: string;
  focalTintOpacity?: number;
  focalTintPosition?: "left" | "center" | "right";
  vignetteOpacity?: number;
  bottomShadeOpacity?: number;
};

export type BackgroundSource = string | ImageSourcePropType | BackgroundSpec;

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

/**
 * Premium non-image background system.
 *
 * Important:
 * - No literal shapes
 * - No faux football diagrams
 * - No travel arcs
 * - No decorative blobs
 *
 * Each screen gets only a tonal identity.
 */
const BACKGROUNDS: Record<BackgroundKey, BackgroundSource> = {
  home: {
    kind: "spec",
    accent: "green",
    colors: ["#08100D", "#09130F", "#0B110E"],
    topTintColor: "#57A238",
    topTintOpacity: 0.08,
    focalTintColor: "#1A3A27",
    focalTintOpacity: 0.12,
    focalTintPosition: "center",
    vignetteOpacity: 0.22,
    bottomShadeOpacity: 0.28,
  },

  explore: {
    kind: "spec",
    accent: "mixed",
    colors: ["#091017", "#0A1216", "#0A0F11"],
    topTintColor: "#1A4A84",
    topTintOpacity: 0.08,
    focalTintColor: "#1A3B2E",
    focalTintOpacity: 0.09,
    focalTintPosition: "center",
    vignetteOpacity: 0.24,
    bottomShadeOpacity: 0.30,
  },

  fixtures: {
    kind: "spec",
    accent: "blue",
    colors: ["#08111D", "#09131A", "#090D10"],
    topTintColor: "#2A5AA8",
    topTintOpacity: 0.09,
    focalTintColor: "#123663",
    focalTintOpacity: 0.10,
    focalTintPosition: "center",
    vignetteOpacity: 0.24,
    bottomShadeOpacity: 0.30,
  },

  match: {
    kind: "spec",
    accent: "blue",
    colors: ["#08111D", "#09131A", "#090D10"],
    topTintColor: "#2A5AA8",
    topTintOpacity: 0.10,
    focalTintColor: "#123663",
    focalTintOpacity: 0.11,
    focalTintPosition: "center",
    vignetteOpacity: 0.24,
    bottomShadeOpacity: 0.30,
  },

  stadium: {
    kind: "spec",
    accent: "green",
    colors: ["#08100D", "#09130F", "#0A0E0C"],
    topTintColor: "#57A238",
    topTintOpacity: 0.07,
    focalTintColor: "#1C3423",
    focalTintOpacity: 0.10,
    focalTintPosition: "center",
    vignetteOpacity: 0.22,
    bottomShadeOpacity: 0.28,
  },

  team: {
    kind: "spec",
    accent: "mixed",
    colors: ["#08110F", "#0A1215", "#0A0E10"],
    topTintColor: "#57A238",
    topTintOpacity: 0.06,
    focalTintColor: "#123663",
    focalTintOpacity: 0.08,
    focalTintPosition: "center",
    vignetteOpacity: 0.22,
    bottomShadeOpacity: 0.28,
  },

  trips: {
    kind: "spec",
    accent: "mixed",
    colors: ["#09111A", "#0A1117", "#090D10"],
    topTintColor: "#1C4E91",
    topTintOpacity: 0.08,
    focalTintColor: "#173222",
    focalTintOpacity: 0.08,
    focalTintPosition: "right",
    vignetteOpacity: 0.24,
    bottomShadeOpacity: 0.30,
  },

  trip: {
    kind: "spec",
    accent: "mixed",
    colors: ["#09111A", "#0A1117", "#090D10"],
    topTintColor: "#1C4E91",
    topTintOpacity: 0.08,
    focalTintColor: "#173222",
    focalTintOpacity: 0.08,
    focalTintPosition: "right",
    vignetteOpacity: 0.24,
    bottomShadeOpacity: 0.30,
  },

  wallet: {
    kind: "spec",
    accent: "neutral",
    colors: ["#0A0D0E", "#0E1212", "#0A0D0D"],
    topTintColor: "#33423B",
    topTintOpacity: 0.05,
    focalTintColor: "#1B2723",
    focalTintOpacity: 0.07,
    focalTintPosition: "left",
    vignetteOpacity: 0.22,
    bottomShadeOpacity: 0.28,
  },

  profile: {
    kind: "spec",
    accent: "neutral",
    colors: ["#0A0C0D", "#0D1111", "#090B0C"],
    topTintColor: "#314438",
    topTintOpacity: 0.04,
    focalTintColor: "#1A221F",
    focalTintOpacity: 0.05,
    focalTintPosition: "center",
    vignetteOpacity: 0.18,
    bottomShadeOpacity: 0.24,
  },

  landing: {
    kind: "spec",
    accent: "green",
    colors: ["#08100D", "#09130F", "#0B110E"],
    topTintColor: "#57A238",
    topTintOpacity: 0.08,
    focalTintColor: "#1A3A27",
    focalTintOpacity: 0.12,
    focalTintPosition: "center",
    vignetteOpacity: 0.22,
    bottomShadeOpacity: 0.28,
  },

  "landing-hero": {
    kind: "spec",
    accent: "green",
    colors: ["#08100D", "#09130F", "#0B110E"],
    topTintColor: "#57A238",
    topTintOpacity: 0.08,
    focalTintColor: "#1A3A27",
    focalTintOpacity: 0.12,
    focalTintPosition: "center",
    vignetteOpacity: 0.22,
    bottomShadeOpacity: 0.28,
  },

  "onboarding-1": {
    kind: "spec",
    accent: "green",
    colors: ["#08100D", "#09130F", "#0B110E"],
    topTintColor: "#57A238",
    topTintOpacity: 0.08,
    focalTintColor: "#1A3A27",
    focalTintOpacity: 0.12,
    focalTintPosition: "center",
    vignetteOpacity: 0.22,
    bottomShadeOpacity: 0.28,
  },

  "onboarding-2": {
    kind: "spec",
    accent: "mixed",
    colors: ["#091017", "#0A1216", "#0A0F11"],
    topTintColor: "#1A4A84",
    topTintOpacity: 0.08,
    focalTintColor: "#1A3B2E",
    focalTintOpacity: 0.09,
    focalTintPosition: "center",
    vignetteOpacity: 0.24,
    bottomShadeOpacity: 0.30,
  },

  "onboarding-3": {
    kind: "spec",
    accent: "blue",
    colors: ["#08111D", "#09131A", "#090D10"],
    topTintColor: "#2A5AA8",
    topTintOpacity: 0.09,
    focalTintColor: "#123663",
    focalTintOpacity: 0.10,
    focalTintPosition: "center",
    vignetteOpacity: 0.24,
    bottomShadeOpacity: 0.30,
  },

  "onboarding-4": {
    kind: "spec",
    accent: "mixed",
    colors: ["#09111A", "#0A1117", "#090D10"],
    topTintColor: "#1C4E91",
    topTintOpacity: 0.08,
    focalTintColor: "#173222",
    focalTintOpacity: 0.08,
    focalTintPosition: "right",
    vignetteOpacity: 0.24,
    bottomShadeOpacity: 0.30,
  },

  paywall: {
    kind: "spec",
    accent: "green",
    colors: ["#08100D", "#09130F", "#0B110E"],
    topTintColor: "#57A238",
    topTintOpacity: 0.08,
    focalTintColor: "#1A3A27",
    focalTintOpacity: 0.12,
    focalTintPosition: "center",
    vignetteOpacity: 0.22,
    bottomShadeOpacity: 0.28,
  },

  // Keep imagery only for city guides.
  city: u("photo-1499856871958-5b9627545d1a"),
};

export function isBackgroundSpec(value: BackgroundSource): value is BackgroundSpec {
  return !!value && typeof value === "object" && "kind" in value && value.kind === "spec";
}

export function getBackground(key: BackgroundKey): BackgroundSource {
  return BACKGROUNDS[key];
}

export function getBackgroundSource(
  key: BackgroundKey
): ImageSourcePropType | { uri: string } | null {
  const src = BACKGROUNDS[key];
  if (isBackgroundSpec(src)) return null;
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

  madrid: u("photo-1539037116277-4db20889f2d4"),
  barcelona: u("photo-1505761671935-60b3a7427bad"),
  valencia: u("photo-1507525428034-b723cf961d3e"),
  seville: u("photo-1505761671935-60b3a7427bad"),
  bilbao: u("photo-1533106418989-88406c7cc8ca"),
  "san-sebastian": u("photo-1533106418989-88406c7cc8ca"),

  munich: u("photo-1467269204594-9661b134dd2b"),
  dortmund: u("photo-1517927033932-b3d18e61fb3a"),
  berlin: u("photo-1526481280695-3c687fd643ed"),

  milan: u("photo-1511818966892-d7d671e672a2"),
  rome: u("photo-1529156069898-49953e39b3ac"),
  naples: u("photo-1529260830199-42c24126f198"),
  turin: u("photo-1516483638261-f4dbaf036963"),

  paris: u("photo-1502602898657-3e91760cbb34"),
  lyon: u("photo-1529429617124-95b109e86bb8"),
  marseille: u("photo-1529260830199-42c24126f198"),

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
