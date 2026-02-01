// src/constants/backgrounds.ts

import type { ImageSourcePropType } from "react-native";

export type BackgroundKey =
  | "home"
  | "fixtures"
  | "trips"
  | "wallet"
  | "profile"
  | "landing"
  | "landing-hero"
  | "onboarding-1"
  | "onboarding-2"
  | "onboarding-3"
  | "onboarding-4";

/**
 * IMPORTANT:
 * These are LOCAL static assets. Metro can only resolve them if the files exist
 * at these exact paths and names.
 *
 * Expected folder:
 *   src/assets/backgrounds/
 *
 * Expected files:
 *   home.png
 *   fixtures.png
 *   trips.png
 *   wallet.png
 *   profile.png
 *   landing-hero.png
 *   onboarding-1.png
 *   onboarding-2.png
 *   onboarding-3.png
 *   onboarding-4.png
 */
const BACKGROUNDS: Record<BackgroundKey, ImageSourcePropType> = {
  home: require("@/src/assets/backgrounds/home.png"),
  fixtures: require("@/src/assets/backgrounds/fixtures.png"),
  trips: require("@/src/assets/backgrounds/trips.png"),
  wallet: require("@/src/assets/backgrounds/wallet.png"),
  profile: require("@/src/assets/backgrounds/profile.png"),

  // Support both keys so older screens don't explode
  landing: require("@/src/assets/backgrounds/landing-hero.png"),
  "landing-hero": require("@/src/assets/backgrounds/landing-hero.png"),

  "onboarding-1": require("@/src/assets/backgrounds/onboarding-1.png"),
  "onboarding-2": require("@/src/assets/backgrounds/onboarding-2.png"),
  "onboarding-3": require("@/src/assets/backgrounds/onboarding-3.png"),
  "onboarding-4": require("@/src/assets/backgrounds/onboarding-4.png"),
};

/**
 * Primary getter used across the app.
 * Includes a fallback so a bad key doesn't hard-crash the UI.
 */
export function getBackground(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUNDS[key] ?? BACKGROUNDS.home;
}

/**
 * Backwards-compatible name (some older screens used this).
 */
export function getBackgroundSource(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUNDS[key] ?? BACKGROUNDS.home;
}

/**
 * Default export for any legacy imports.
 */
export default BACKGROUNDS;
