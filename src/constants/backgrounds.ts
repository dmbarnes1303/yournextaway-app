// src/constants/backgrounds.ts
import type { ImageSourcePropType } from "react-native";

export type BackgroundKey =
  | "landingHero"
  | "home"
  | "onboarding1"
  | "onboarding2"
  | "onboarding3"
  | "onboarding4";

const BACKGROUNDS: Record<BackgroundKey, ImageSourcePropType> = {
  landingHero: require("@/src/assets/backgrounds/landing-hero.png"),
  home: require("@/src/assets/backgrounds/home.png"),

  onboarding1: require("@/src/assets/backgrounds/onboarding-1.png"),
  onboarding2: require("@/src/assets/backgrounds/onboarding-2.png"),
  onboarding3: require("@/src/assets/backgrounds/onboarding-3.png"),
  onboarding4: require("@/src/assets/backgrounds/onboarding-4.png"),
};

export function getBackgroundSource(key: BackgroundKey): ImageSourcePropType {
  return BACKGROUNDS[key];
}
