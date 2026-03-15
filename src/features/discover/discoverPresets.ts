import type { InspirationPreset, QuickSpark } from "./types";

export const PLACEHOLDER_DISCOVER_IMAGE =
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1600&h=1000&fm=jpg&q=82";

export const INSPIRATION_PRESETS: InspirationPreset[] = [
  {
    id: "best-now",
    title: "Best trips right now",
    subtitle: "Strong live options for a football trip soon",
    icon: "flash-outline",
    category: "perfectTrips",
    windowKey: "d30",
  },
  {
    id: "easy",
    title: "Easy city breaks",
    subtitle: "Lower-friction trips with cleaner planning potential",
    icon: "navigate-outline",
    vibe: "easy",
    category: "easyTickets",
    windowKey: "d30",
    tripLength: "2",
  },
  {
    id: "big",
    title: "Big matches",
    subtitle: "High-profile fixtures worth travelling for",
    icon: "star-outline",
    vibe: "big",
    category: "bigMatches",
    windowKey: "d60",
  },
  {
    id: "europe",
    title: "European nights",
    subtitle: "Champions League, Europa League and Conference League pull",
    icon: "flash-outline",
    vibe: "big",
    category: "europeanNights",
    windowKey: "d30",
  },
  {
    id: "weekend",
    title: "Weekend football trips",
    subtitle: "Friday-to-Sunday trips with cleaner stacking potential",
    icon: "calendar-outline",
    category: "weekendTrips",
    windowKey: "wknd",
    tripLength: "2",
  },
  {
    id: "culture",
    title: "City + match trips",
    subtitle: "Trips where the place matters as much as the game",
    icon: "people-outline",
    vibe: "culture",
    category: "matchdayCulture",
    windowKey: "d60",
  },
];

export const QUICK_SPARKS: QuickSpark[] = [
  {
    id: "european-nights",
    title: "European nights",
    icon: "flash-outline",
    category: "europeanNights",
    vibe: "big",
    windowKey: "d30",
  },
  {
    id: "weekend-stacks",
    title: "Weekend football trips",
    icon: "calendar-outline",
    category: "weekendTrips",
    tripLength: "2",
    windowKey: "wknd",
  },
  {
    id: "multi-match",
    title: "Multi-match trips",
    icon: "git-compare-outline",
    category: "multiMatchTrips",
    tripLength: "2",
    windowKey: "d30",
  },
  {
    id: "derby-nights",
    title: "Big derby nights",
    icon: "flame-outline",
    category: "derbies",
    vibe: "big",
    windowKey: "d90",
  },
  {
    id: "midweek-football",
    title: "Midweek football trips",
    icon: "moon-outline",
    category: "nightMatches",
    vibe: "nightlife",
    windowKey: "d30",
  },
  {
    id: "best-value",
    title: "Best value trips",
    icon: "cash-outline",
    category: "valueTrips",
    vibe: "easy",
    windowKey: "d60",
  },
];
