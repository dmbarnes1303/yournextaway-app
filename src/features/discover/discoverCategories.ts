import { Ionicons } from "@expo/vector-icons";

export type DiscoverCategory =
  | "bigMatches"
  | "derbies"
  | "atmospheres"
  | "valueTrips"
  | "legendaryStadiums"
  | "iconicCities"
  | "perfectTrips"
  | "nightMatches"
  | "titleDrama"
  | "easyTickets"
  | "bucketList"
  | "matchdayCulture"
  | "underratedTrips";

export type DiscoverCategoryMeta = {
  title: string;
  subtitle: string;
  helper: string;
  icon: keyof typeof Ionicons.glyphMap;
  emphasis?: "primary" | "neutral";
};

export const DISCOVER_ROWS: DiscoverCategory[][] = [
  [
    "bigMatches",
    "derbies",
    "atmospheres",
    "valueTrips",
    "legendaryStadiums",
  ],
  [
    "iconicCities",
    "perfectTrips",
    "nightMatches",
    "titleDrama",
    "easyTickets",
  ],
  [
    "bucketList",
    "matchdayCulture",
    "underratedTrips",
  ],
];

export const DISCOVER_CATEGORY_META: Record<DiscoverCategory, DiscoverCategoryMeta> = {
  bigMatches: {
    title: "Big Matches",
    subtitle: "High-profile fixtures worth travelling for",
    helper:
      "Discover mode • ranked for occasion, club size, derby energy, and night factor",
    icon: "star-outline",
    emphasis: "primary",
  },

  derbies: {
    title: "Derbies & Rivalries",
    subtitle: "Tension, history, noise, chaos",
    helper: "Discover mode • ranked for derby intensity first",
    icon: "flame-outline",
    emphasis: "primary",
  },

  atmospheres: {
    title: "Insane Atmospheres",
    subtitle: "Best noise, intensity and matchday energy",
    helper: "Discover mode • ranked for atmosphere and occasion",
    icon: "radio-outline",
    emphasis: "primary",
  },

  valueTrips: {
    title: "Best Value Football Trips",
    subtitle: "Better experience-per-pound potential",
    helper: "Discover mode • ranked for value over prestige",
    icon: "cash-outline",
    emphasis: "neutral",
  },

  legendaryStadiums: {
    title: "Legendary Stadiums",
    subtitle: "Grounds with weight, history and pull",
    helper: "Discover mode • ranked for stadium and club prestige",
    icon: "business-outline",
    emphasis: "neutral",
  },

  iconicCities: {
    title: "Iconic Football Cities",
    subtitle: "Trips where the city matters as much as the match",
    helper: "Discover mode • ranked for city pull and trip appeal",
    icon: "earth-outline",
    emphasis: "neutral",
  },

  perfectTrips: {
    title: "Perfect Football Trips",
    subtitle: "Strong fixture plus solid travel potential",
    helper: "Discover mode • ranked for overall trip quality",
    icon: "navigate-outline",
    emphasis: "neutral",
  },

  nightMatches: {
    title: "Night Matches",
    subtitle: "Evening kickoffs with better match feel",
    helper: "Discover mode • ranked for later kickoffs and atmosphere",
    icon: "moon-outline",
    emphasis: "neutral",
  },

  titleDrama: {
    title: "Title Race Drama",
    subtitle: "Fixtures with sharper end-of-season stakes",
    helper: "Discover mode • ranked for title-race tension signals",
    icon: "trophy-outline",
    emphasis: "neutral",
  },

  easyTickets: {
    title: "Easy Ticket Matches",
    subtitle: "Better chance of accessible home tickets",
    helper: "Discover mode • ranked for easier ticket difficulty first",
    icon: "ticket-outline",
    emphasis: "neutral",
  },

  bucketList: {
    title: "Football Bucket List",
    subtitle: "Trips people should do at least once",
    helper:
      "Discover mode • ranked for prestige, atmosphere, and destination pull",
    icon: "bookmark-outline",
    emphasis: "neutral",
  },

  matchdayCulture: {
    title: "Best Matchday Culture",
    subtitle: "Beyond the 90 minutes",
    helper: "Discover mode • ranked for culture and atmosphere",
    icon: "people-outline",
    emphasis: "neutral",
  },

  underratedTrips: {
    title: "Underrated Trips",
    subtitle: "Less obvious, more interesting",
    helper: "Discover mode • ranked away from obvious glamour picks",
    icon: "sparkles-outline",
    emphasis: "neutral",
  },
};

export function isDiscoverCategory(value: string | null): value is DiscoverCategory {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(DISCOVER_CATEGORY_META, value);
}
