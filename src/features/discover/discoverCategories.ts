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

export const DISCOVER_ALL_CATEGORIES: DiscoverCategory[] = [
  ...DISCOVER_PRIMARY_CATEGORIES,
  ...DISCOVER_SECONDARY_CATEGORIES,
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
    subtitle: "History, tension and serious edge",
    helper: "Discover mode • ranked for rivalry intensity first",
    icon: "flame-outline",
    emphasis: "primary",
  },

  atmospheres: {
    title: "Insane Atmospheres",
    subtitle: "Noise, intensity and full matchday energy",
    helper: "Discover mode • ranked for atmosphere and crowd force",
    icon: "radio-outline",
    emphasis: "primary",
  },

  valueTrips: {
    title: "Best Value Football Trips",
    subtitle: "Better experience-per-pound potential",
    helper: "Discover mode • ranked for value, ease and usable trip quality",
    icon: "cash-outline",
    emphasis: "primary",
  },

  perfectTrips: {
    title: "Perfect Football Trips",
    subtitle: "Best overall football city-break balance",
    helper: "Discover mode • ranked for all-round trip quality, city pull and ease",
    icon: "navigate-outline",
    emphasis: "primary",
  },

  easyTickets: {
    title: "Easy Ticket Matches",
    subtitle: "Better chance of an accessible home-ticket route",
    helper: "Discover mode • ranked for ticket access and short-trip simplicity",
    icon: "ticket-outline",
    emphasis: "primary",
  },

  legendaryStadiums: {
    title: "Legendary Stadiums",
    subtitle: "Grounds with history, status and pull",
    helper: "Discover mode • ranked for stadium prestige and club pull",
    icon: "business-outline",
    emphasis: "secondary",
  },

  iconicCities: {
    title: "Iconic Football Cities",
    subtitle: "Trips where the city matters as much as the match",
    helper: "Discover mode • ranked for city pull, football weight and nightlife",
    icon: "earth-outline",
    emphasis: "secondary",
  },

  nightMatches: {
    title: "Night Matches",
    subtitle: "Later kickoffs with stronger match feel",
    helper: "Discover mode • ranked for evening kickoffs and nightlife fit",
    icon: "moon-outline",
    emphasis: "secondary",
  },

  titleDrama: {
    title: "Title Race Drama",
    subtitle: "Fixtures with sharper late-season stakes",
    helper: "Discover mode • ranked for pressure and end-of-season tension",
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
