import type { ImageSourcePropType } from "react-native";
import { normalizeCityKey } from "@/src/utils/city";

export type BackgroundPattern =
  | "none"
  | "pitch"
  | "routes"
  | "grid"
  | "vault"
  | "calm";

export type BackgroundAccent = "green" | "blue" | "neutral" | "mixed";

export type BackgroundSpec = {
  kind: "spec";
  accent: BackgroundAccent;
  pattern: BackgroundPattern;
  colors: [string, string, string];
  topGlowColor: string;
  topGlowOpacity?: number;
  centerGlowColor?: string;
  centerGlowOpacity?: number;
  bottomShadeOpacity?: number;
  grainOpacity?: number;
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
 * Main tabs + app shells now use branded generated surfaces instead of photos.
 * That gives you consistent contrast, cleaner card readability, and a more premium feel.
 */
const BACKGROUNDS: Record<BackgroundKey, BackgroundSource> = {
  // Core tabs
  home: {
    kind: "spec",
    accent: "green",
    pattern: "pitch",
    colors: ["#07110D", "#0A1711", "#101C16"],
    topGlowColor: "#5CCB5F",
    topGlowOpacity: 0.16,
    centerGlowColor: "#173224",
    centerGlowOpacity: 0.16,
    bottomShadeOpacity: 0.22,
    grainOpacity: 0.03,
  },

  explore: {
    kind: "spec",
    accent: "mixed",
    pattern: "routes",
    colors: ["#071018", "#0A1416", "#111A1B"],
    topGlowColor: "#4E76D9",
    topGlowOpacity: 0.14,
    centerGlowColor: "#4FAE72",
    centerGlowOpacity: 0.1,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.03,
  },

  fixtures: {
    kind: "spec",
    accent: "blue",
    pattern: "grid",
    colors: ["#071018", "#09141C", "#0D1920"],
    topGlowColor: "#2D6CDF",
    topGlowOpacity: 0.14,
    centerGlowColor: "#0F3C64",
    centerGlowOpacity: 0.12,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.025,
  },

  match: {
    kind: "spec",
    accent: "blue",
    pattern: "grid",
    colors: ["#071018", "#09141C", "#0D1920"],
    topGlowColor: "#2D6CDF",
    topGlowOpacity: 0.16,
    centerGlowColor: "#0F3C64",
    centerGlowOpacity: 0.14,
    bottomShadeOpacity: 0.26,
    grainOpacity: 0.025,
  },

  stadium: {
    kind: "spec",
    accent: "green",
    pattern: "pitch",
    colors: ["#07110D", "#09150F", "#0F1A14"],
    topGlowColor: "#4FAE72",
    topGlowOpacity: 0.14,
    centerGlowColor: "#163325",
    centerGlowOpacity: 0.1,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.03,
  },

  team: {
    kind: "spec",
    accent: "mixed",
    pattern: "pitch",
    colors: ["#07110D", "#0A1418", "#101A17"],
    topGlowColor: "#4FAE72",
    topGlowOpacity: 0.12,
    centerGlowColor: "#345FA8",
    centerGlowOpacity: 0.08,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.03,
  },

  trips: {
    kind: "spec",
    accent: "mixed",
    pattern: "routes",
    colors: ["#071018", "#0A1318", "#10171D"],
    topGlowColor: "#4E76D9",
    topGlowOpacity: 0.14,
    centerGlowColor: "#5CCB5F",
    centerGlowOpacity: 0.08,
    bottomShadeOpacity: 0.26,
    grainOpacity: 0.025,
  },

  trip: {
    kind: "spec",
    accent: "mixed",
    pattern: "routes",
    colors: ["#071018", "#0A1318", "#10171D"],
    topGlowColor: "#4E76D9",
    topGlowOpacity: 0.14,
    centerGlowColor: "#5CCB5F",
    centerGlowOpacity: 0.08,
    bottomShadeOpacity: 0.26,
    grainOpacity: 0.025,
  },

  wallet: {
    kind: "spec",
    accent: "neutral",
    pattern: "vault",
    colors: ["#090B0D", "#101517", "#151B1C"],
    topGlowColor: "#3C5662",
    topGlowOpacity: 0.11,
    centerGlowColor: "#22353A",
    centerGlowOpacity: 0.08,
    bottomShadeOpacity: 0.28,
    grainOpacity: 0.02,
  },

  profile: {
    kind: "spec",
    accent: "neutral",
    pattern: "calm",
    colors: ["#0A0C0D", "#111515", "#171B1A"],
    topGlowColor: "#314438",
    topGlowOpacity: 0.08,
    centerGlowColor: "#1B2421",
    centerGlowOpacity: 0.05,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.018,
  },

  // Entry / onboarding / paywall
  landing: {
    kind: "spec",
    accent: "green",
    pattern: "pitch",
    colors: ["#07110D", "#0A1711", "#101C16"],
    topGlowColor: "#5CCB5F",
    topGlowOpacity: 0.16,
    centerGlowColor: "#173224",
    centerGlowOpacity: 0.16,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.03,
  },

  "landing-hero": {
    kind: "spec",
    accent: "green",
    pattern: "pitch",
    colors: ["#07110D", "#0A1711", "#101C16"],
    topGlowColor: "#5CCB5F",
    topGlowOpacity: 0.16,
    centerGlowColor: "#173224",
    centerGlowOpacity: 0.16,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.03,
  },

  "onboarding-1": {
    kind: "spec",
    accent: "green",
    pattern: "pitch",
    colors: ["#07110D", "#0A1711", "#101C16"],
    topGlowColor: "#5CCB5F",
    topGlowOpacity: 0.16,
    centerGlowColor: "#173224",
    centerGlowOpacity: 0.16,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.03,
  },

  "onboarding-2": {
    kind: "spec",
    accent: "mixed",
    pattern: "routes",
    colors: ["#071018", "#0A1416", "#111A1B"],
    topGlowColor: "#4E76D9",
    topGlowOpacity: 0.14,
    centerGlowColor: "#4FAE72",
    centerGlowOpacity: 0.1,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.03,
  },

  "onboarding-3": {
    kind: "spec",
    accent: "blue",
    pattern: "grid",
    colors: ["#071018", "#09141C", "#0D1920"],
    topGlowColor: "#2D6CDF",
    topGlowOpacity: 0.14,
    centerGlowColor: "#0F3C64",
    centerGlowOpacity: 0.12,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.025,
  },

  "onboarding-4": {
    kind: "spec",
    accent: "mixed",
    pattern: "routes",
    colors: ["#071018", "#0A1318", "#10171D"],
    topGlowColor: "#4E76D9",
    topGlowOpacity: 0.14,
    centerGlowColor: "#5CCB5F",
    centerGlowOpacity: 0.08,
    bottomShadeOpacity: 0.26,
    grainOpacity: 0.025,
  },

  paywall: {
    kind: "spec",
    accent: "green",
    pattern: "pitch",
    colors: ["#07110D", "#0A1711", "#101C16"],
    topGlowColor: "#5CCB5F",
    topGlowOpacity: 0.16,
    centerGlowColor: "#173224",
    centerGlowOpacity: 0.16,
    bottomShadeOpacity: 0.24,
    grainOpacity: 0.03,
  },

  // City guides can still use imagery
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
