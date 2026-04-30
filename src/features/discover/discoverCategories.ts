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
  | "underratedTrips"
  | "europeanNights"
  | "multiMatchTrips"
  | "weekendTrips";

export type DiscoverCategoryMeta = {
  title: string;
  subtitle: string;
  helper: string;
  icon: keyof typeof Ionicons.glyphMap;
  emphasis: "primary" | "secondary";
};

export const DISCOVER_PRIMARY_CATEGORIES: DiscoverCategory[] = [
  "perfectTrips",
  "bigMatches",
  "weekendTrips",
  "multiMatchTrips",
  "easyTickets",
  "valueTrips",
  "atmospheres",
  "derbies",
];

export const DISCOVER_SECONDARY_CATEGORIES: DiscoverCategory[] = [
  "europeanNights",
  "legendaryStadiums",
  "iconicCities",
  "nightMatches",
  "bucketList",
  "matchdayCulture",
  "titleDrama",
  "underratedTrips",
];

export const DISCOVER_ALL_CATEGORIES: DiscoverCategory[] = [
  ...DISCOVER_PRIMARY_CATEGORIES,
  ...DISCOVER_SECONDARY_CATEGORIES,
];

export const DISCOVER_CATEGORY_META: Record<DiscoverCategory, DiscoverCategoryMeta> = {
  perfectTrips: {
    title: "Perfect Trips",
    subtitle: "Best all-round football breaks",
    helper: "Balanced picks ranked for fixture pull, city quality, access and trip shape.",
    icon: "navigate-outline",
    emphasis: "primary",
  },

  bigMatches: {
    title: "Big Matches",
    subtitle: "Major fixtures worth building around",
    helper: "Higher-profile games with stronger occasion, glamour, atmosphere and stakes.",
    icon: "star-outline",
    emphasis: "primary",
  },

  weekendTrips: {
    title: "Weekend Trips",
    subtitle: "Cleaner Friday-to-Sunday breaks",
    helper: "Fixtures and cities that fit a proper weekend football escape.",
    icon: "calendar-outline",
    emphasis: "primary",
  },

  multiMatchTrips: {
    title: "Multi-Match Trips",
    subtitle: "Stack fixtures into one trip",
    helper: "Cities and routes with stronger potential for two or more matches.",
    icon: "git-compare-outline",
    emphasis: "primary",
  },

  easyTickets: {
    title: "Easier Ticket Routes",
    subtitle: "Lower-friction match options",
    helper: "Routes where access, planning and short-trip simplicity should be more manageable.",
    icon: "ticket-outline",
    emphasis: "primary",
  },

  valueTrips: {
    title: "Best Value Trips",
    subtitle: "Better experience per pound",
    helper: "Smarter routes ranked for value, ease and usable trip quality.",
    icon: "cash-outline",
    emphasis: "primary",
  },

  atmospheres: {
    title: "Best Atmospheres",
    subtitle: "Loud, high-energy matchdays",
    helper: "Ranked for crowd force, club culture, intensity and matchday feel.",
    icon: "radio-outline",
    emphasis: "primary",
  },

  derbies: {
    title: "Derbies & Rivalries",
    subtitle: "History, tension and edge",
    helper: "Rivalry-first picks where the fixture has more bite than a standard game.",
    icon: "flame-outline",
    emphasis: "primary",
  },

  europeanNights: {
    title: "European Nights",
    subtitle: "Continental fixtures with pull",
    helper: "Champions League, Europa League and Conference League routes with stronger night-game feel.",
    icon: "flash-outline",
    emphasis: "secondary",
  },

  legendaryStadiums: {
    title: "Legendary Stadiums",
    subtitle: "Ground-led football trips",
    helper: "Routes where the stadium, club history and venue prestige do the heavy lifting.",
    icon: "business-outline",
    emphasis: "secondary",
  },

  iconicCities: {
    title: "Iconic Football Cities",
    subtitle: "City-first travel ideas",
    helper: "Trips where the destination matters almost as much as the fixture.",
    icon: "earth-outline",
    emphasis: "secondary",
  },

  nightMatches: {
    title: "Night Matches",
    subtitle: "Lights-on football energy",
    helper: "Later kickoffs with stronger atmosphere, city-night and nightlife overlap.",
    icon: "moon-outline",
    emphasis: "secondary",
  },

  bucketList: {
    title: "Bucket List Trips",
    subtitle: "Football trips to do once",
    helper: "Prestige, atmosphere, destination pull and ground status in one route.",
    icon: "bookmark-outline",
    emphasis: "secondary",
  },

  matchdayCulture: {
    title: "Matchday Culture",
    subtitle: "Beyond the 90 minutes",
    helper: "Trips ranked for football culture, city feel, supporters, rituals and atmosphere.",
    icon: "people-outline",
    emphasis: "secondary",
  },

  titleDrama: {
    title: "Pressure Fixtures",
    subtitle: "Late-season stakes and tension",
    helper: "Fixtures with sharper title, European-place or end-of-season pressure.",
    icon: "trophy-outline",
    emphasis: "secondary",
  },

  underratedTrips: {
    title: "Underrated Trips",
    subtitle: "Less obvious, more interesting",
    helper: "Hidden-upside routes that avoid only chasing the obvious glamour picks.",
    icon: "sparkles-outline",
    emphasis: "secondary",
  },
};

export function isDiscoverCategory(value: string | null): value is DiscoverCategory {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(DISCOVER_CATEGORY_META, value);
}
