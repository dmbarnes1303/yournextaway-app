import { Ionicons } from "@expo/vector-icons";

export type DiscoverCategory =
  | "bigMatches"
  | "derbies"
  | "atmospheres"
  | "valueTrips"
  | "perfectTrips"
  | "easyTickets"
  | "legendaryStadiums"
  | "iconicCities"
  | "nightMatches"
  | "titleDrama"
  | "bucketList"
  | "matchdayCulture"
  | "underratedTrips";

export type DiscoverCategoryMeta = {
  title: string;
  subtitle: string;
  helper: string;
  icon: keyof typeof Ionicons.glyphMap;
  emphasis: "primary" | "secondary";
};

export const DISCOVER_PRIMARY_CATEGORIES: DiscoverCategory[] = [
  "bigMatches",
  "derbies",
  "atmospheres",
  "valueTrips",
  "perfectTrips",
  "easyTickets",
];

export const DISCOVER_SECONDARY_CATEGORIES: DiscoverCategory[] = [
  "legendaryStadiums",
  "iconicCities",
  "nightMatches",
  "titleDrama",
  "bucketList",
  "matchdayCulture",
  "underratedTrips",
];

/**
 * Kept for backward compatibility with current consumers.
 * Primary row first, then secondary rows.
 */
export const DISCOVER_ROWS: DiscoverCategory[][] = [
  DISCOVER_PRIMARY_CATEGORIES,
  ["legendaryStadiums", "iconicCities", "nightMatches", "titleDrama"],
  ["bucketList", "matchdayCulture", "underratedTrips"],
];

export const DISCOVER_CATEGORY_META: Record<DiscoverCategory, DiscoverCategoryMeta> = {
  bigMatches: {
    title: "Big Matches",
    subtitle: "High-profile fixtures worth travelling for",
    helper: "Discover mode • ranked for occasion, glamour, atmosphere and stakes",
    icon: "star-outline",
    emphasis: "primary",
  },

  derbies: {
    title: "Derbies & Rivalries",
    subtitle: "Tension, history, noise, chaos",
    helper: "Discover mode • ranked for rivalry intensity first",
    icon: "flame-outline",
    emphasis: "primary",
  },

  atmospheres: {
    title: "Insane Atmospheres",
    subtitle: "Best noise, intensity and matchday energy",
    helper: "Discover mode • ranked for atmosphere and culture",
    icon: "radio-outline",
    emphasis: "primary",
  },

  valueTrips: {
    title: "Best Value Football Trips",
    subtitle: "Better experience-per-pound potential",
    helper: "Discover mode • ranked for value, ease and usable quality",
    icon: "cash-outline",
    emphasis: "primary",
  },

  perfectTrips: {
    title: "Perfect Football Trips",
    subtitle: "Best overall football city-break balance",
    helper: "Discover mode • ranked for overall trip quality, city pull and ease",
    icon: "navigate-outline",
    emphasis: "primary",
  },

  easyTickets: {
    title: "Easy Ticket Matches",
    subtitle: "Better chance of an accessible home-ticket route",
    helper: "Discover mode • ranked for easier ticket access and trip simplicity",
    icon: "ticket-outline",
    emphasis: "primary",
  },

  legendaryStadiums: {
    title: "Legendary Stadiums",
    subtitle: "Grounds with weight, history and pull",
    helper: "Discover mode • ranked for stadium prestige and club pull",
    icon: "business-outline",
    emphasis: "secondary",
  },

  iconicCities: {
    title: "Iconic Football Cities",
    subtitle: "Trips where the city matters as much as the match",
    helper: "Discover mode • ranked for city pull, nightlife and football weight",
    icon: "earth-outline",
    emphasis: "secondary",
  },

  nightMatches: {
    title: "Night Matches",
    subtitle: "Later kickoffs with better match feel",
    helper: "Discover mode • ranked for evening kickoffs and nightlife fit",
    icon: "moon-outline",
    emphasis: "secondary",
  },

  titleDrama: {
    title: "Title Race Drama",
    subtitle: "Fixtures with sharper end-of-season stakes",
    helper: "Discover mode • ranked for pressure and late-season tension",
    icon: "trophy-outline",
    emphasis: "secondary",
  },

  bucketList: {
    title: "Football Bucket List",
    subtitle: "Trips people should do at least once",
    helper: "Discover mode • ranked for prestige, atmosphere and destination pull",
    icon: "bookmark-outline",
    emphasis: "secondary",
  },

  matchdayCulture: {
    title: "Best Matchday Culture",
    subtitle: "Trips that feel bigger than the 90 minutes",
    helper: "Discover mode • ranked for football culture, city feel and atmosphere",
    icon: "people-outline",
    emphasis: "secondary",
  },

  underratedTrips: {
    title: "Underrated Trips",
    subtitle: "Less obvious, more interesting",
    helper: "Discover mode • ranked away from the obvious glamour picks",
    icon: "sparkles-outline",
    emphasis: "secondary",
  },
};

export function isDiscoverCategory(value: string | null): value is DiscoverCategory {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(DISCOVER_CATEGORY_META, value);
}
