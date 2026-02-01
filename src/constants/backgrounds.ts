// src/constants/backgrounds.ts
import type { ImageSourcePropType } from "react-native";

export type BackgroundKey =
  | "home"
  | "fixtures"
  | "trips"
  | "landing"
  | "landing-hero"
  | "onboarding-1"
  | "onboarding-2"
  | "onboarding-3"
  | "onboarding-4";

const BACKGROUNDS: Record<BackgroundKey, ImageSourcePropType> = {
  home: require("@/src/assets/backgrounds/home.png"),
  fixtures: require("@/src/assets/backgrounds/fixtures.png"),
  trips: require("@/src/assets/backgrounds/trips.png"),

  // Support both keys so older screens don't explode
  landing: require("@/src/assets/backgrounds/landing-hero.png"),
  "landing-hero": require("@/src/assets/backgrounds/landing-hero.png"),

  "onboarding-1": require("@/src/assets/backgrounds/onboarding-1.png"),
  "onboarding-2": require("@/src/assets/backgrounds/onboarding-2.png"),
  "onboarding-3": require("@/src/assets/backgrounds/onboarding-3.png"),
  "onboarding-4": require("@/src/assets/backgrounds/onboarding-4.png"),
};

/**
 * Preferred accessor used by screens.
 */
export function getBackground(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUNDS[key];
}

/**
 * Backwards-compatible name (legacy screens).
 */
export function getBackgroundSource(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUNDS[key];
}

export default BACKGROUNDS;
