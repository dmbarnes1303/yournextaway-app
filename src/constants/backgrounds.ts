import type { ImageSourcePropType } from "react-native";
import { normalizeCityKey } from "@/src/utils/city";

export type BackgroundAccent = "green" | "gold" | "neutral" | "mixed";

export type BackgroundSpec = {
  kind: "spec";
  accent: BackgroundAccent;
  colors: [string, string, string];
  topTintColor?: string;
  topTintOpacity?: number;
  sideTintColor?: string;
  sideTintOpacity?: number;
  sideTintSide?: "left" | "right" | "both";
  bottomShadeOpacity?: number;
  vignetteOpacity?: number;
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

const spec = (
  accent: BackgroundAccent,
  colors: [string, string, string],
  opts?: Omit<BackgroundSpec, "kind" | "accent" | "colors">
): BackgroundSpec => ({
  kind: "spec",
  accent,
  colors,
  topTintColor: opts?.topTintColor,
  topTintOpacity: opts?.topTintOpacity,
  sideTintColor: opts?.sideTintColor,
  sideTintOpacity: opts?.sideTintOpacity,
  sideTintSide: opts?.sideTintSide,
  bottomShadeOpacity: opts?.bottomShadeOpacity ?? 0.18,
  vignetteOpacity: opts?.vignetteOpacity ?? 0.1,
});

const BRAND_GREEN = "#22C55E";
const BRAND_GOLD = "#FACC15";

const BACKGROUNDS: Record<BackgroundKey, BackgroundSource> = {
  home: spec("green", ["#050505", "#08100B", "#0D1811"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.09,
    sideTintColor: BRAND_GREEN,
    sideTintOpacity: 0.045,
    sideTintSide: "left",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.12,
  }),

  explore: spec("mixed", ["#050505", "#0A100B", "#161308"], {
    topTintColor: BRAND_GOLD,
    topTintOpacity: 0.08,
    sideTintColor: BRAND_GREEN,
    sideTintOpacity: 0.035,
    sideTintSide: "right",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.12,
  }),

  fixtures: spec("gold", ["#050505", "#111008", "#171308"], {
    topTintColor: BRAND_GOLD,
    topTintOpacity: 0.095,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.05,
    sideTintSide: "right",
    bottomShadeOpacity: 0.22,
    vignetteOpacity: 0.12,
  }),

  match: spec("gold", ["#050505", "#111008", "#191508"], {
    topTintColor: BRAND_GOLD,
    topTintOpacity: 0.11,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.055,
    sideTintSide: "right",
    bottomShadeOpacity: 0.24,
    vignetteOpacity: 0.13,
  }),

  stadium: spec("green", ["#050505", "#08100B", "#0D1811"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.08,
    sideTintColor: BRAND_GREEN,
    sideTintOpacity: 0.03,
    sideTintSide: "left",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.11,
  }),

  team: spec("mixed", ["#050505", "#08100B", "#151208"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.06,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.03,
    sideTintSide: "both",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.11,
  }),

  trips: spec("mixed", ["#050505", "#08100B", "#151208"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.065,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.028,
    sideTintSide: "left",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.11,
  }),

  trip: spec("mixed", ["#050505", "#08100B", "#151208"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.065,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.028,
    sideTintSide: "left",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.11,
  }),

  wallet: spec("gold", ["#050505", "#0E0C07", "#171308"], {
    topTintColor: BRAND_GOLD,
    topTintOpacity: 0.07,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.026,
    sideTintSide: "right",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.11,
  }),

  profile: spec("neutral", ["#050505", "#0A0D0B", "#111412"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.03,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.018,
    sideTintSide: "right",
    bottomShadeOpacity: 0.18,
    vignetteOpacity: 0.1,
  }),

  landing: spec("green", ["#050505", "#08100B", "#0D1811"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.09,
    sideTintColor: BRAND_GREEN,
    sideTintOpacity: 0.04,
    sideTintSide: "left",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.12,
  }),

  "landing-hero": spec("mixed", ["#050505", "#08100B", "#151208"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.085,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.035,
    sideTintSide: "right",
    bottomShadeOpacity: 0.22,
    vignetteOpacity: 0.13,
  }),

  "onboarding-1": spec("green", ["#050505", "#08100B", "#0D1811"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.08,
    sideTintColor: BRAND_GREEN,
    sideTintOpacity: 0.035,
    sideTintSide: "left",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.11,
  }),

  "onboarding-2": spec("mixed", ["#050505", "#08100B", "#151208"], {
    topTintColor: BRAND_GOLD,
    topTintOpacity: 0.075,
    sideTintColor: BRAND_GREEN,
    sideTintOpacity: 0.03,
    sideTintSide: "right",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.11,
  }),

  "onboarding-3": spec("gold", ["#050505", "#111008", "#171308"], {
    topTintColor: BRAND_GOLD,
    topTintOpacity: 0.09,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.045,
    sideTintSide: "right",
    bottomShadeOpacity: 0.21,
    vignetteOpacity: 0.12,
  }),

  "onboarding-4": spec("mixed", ["#050505", "#08100B", "#151208"], {
    topTintColor: BRAND_GREEN,
    topTintOpacity: 0.06,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.03,
    sideTintSide: "left",
    bottomShadeOpacity: 0.2,
    vignetteOpacity: 0.11,
  }),

  paywall: spec("gold", ["#050505", "#111008", "#171308"], {
    topTintColor: BRAND_GOLD,
    topTintOpacity: 0.09,
    sideTintColor: BRAND_GOLD,
    sideTintOpacity: 0.04,
    sideTintSide: "left",
    bottomShadeOpacity: 0.22,
    vignetteOpacity: 0.12,
  }),

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

/**
 * Controlled city fallback.
 * Do not use random featured search URLs — they are unstable and often irrelevant.
 * This fallback is deterministic and city-focused.
 */
function unsplashCityFallback(cityKey: string) {
  const q = cityKey.replace(/-/g, " ").trim();
  return `https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&h=3200&fm=jpg&q=82&city=${encodeURIComponent(
    q
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
