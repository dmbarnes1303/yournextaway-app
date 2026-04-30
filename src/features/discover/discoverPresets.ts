// src/features/discover/discoverPresets.ts

import type { InspirationPreset, QuickSpark } from "./types";

export const PLACEHOLDER_DISCOVER_IMAGE =
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1600&h=1000&fm=jpg&q=82";

/* -------------------------------------------------------------------------- */
/* Inspiration presets (editorial entry points)                                */
/* -------------------------------------------------------------------------- */

export const INSPIRATION_PRESETS: InspirationPreset[] = [
  {
    id: "best-now",
    title: "Best trips right now",
    subtitle: "Strongest overall football-trip options in the near window",
    icon: "flash-outline",
    category: "perfectTrips",
    windowKey: "d30",
  },
  {
    id: "easy",
    title: "Easy city breaks",
    subtitle: "Low-friction trips with realistic access and simple planning",
    icon: "navigate-outline",
    vibe: "easy",
    category: "easyTickets",
    windowKey: "d30",
    tripLength: "2",
  },
  {
    id: "big",
    title: "Big match trips",
    subtitle: "High-profile fixtures with real occasion and travel pull",
    icon: "star-outline",
    vibe: "big",
    category: "bigMatches",
    windowKey: "d60",
  },
  {
    id: "europe",
    title: "European nights",
    subtitle: "Midweek continental fixtures with stronger atmosphere and pull",
    icon: "flash-outline",
    vibe: "big",
    category: "europeanNights",
    windowKey: "d30",
  },
  {
    id: "weekend",
    title: "Weekend football trips",
    subtitle: "Clean Friday–Sunday trips that actually work in practice",
    icon: "calendar-outline",
    category: "weekendTrips",
    windowKey: "wknd",
    tripLength: "2",
  },
  {
    id: "culture",
    title: "City + match trips",
    subtitle: "Trips where the destination matters as much as the fixture",
    icon: "people-outline",
    vibe: "culture",
    category: "matchdayCulture",
    windowKey: "d60",
  },
];

/* -------------------------------------------------------------------------- */
/* Quick sparks (fast entry shortcuts)                                         */
/* -------------------------------------------------------------------------- */

export const QUICK_SPARKS: QuickSpark[] = [
  {
    id: "big-now",
    title: "Big matches now",
    icon: "flame-outline",
    category: "bigMatches",
    vibe: "big",
    windowKey: "d14",
  },
  {
    id: "european-nights",
    title: "European nights",
    icon: "flash-outline",
    category: "europeanNights",
    vibe: "big",
    windowKey: "d30",
  },
  {
    id: "weekend-trips",
    title: "Weekend trips",
    icon: "calendar-outline",
    category: "weekendTrips",
    tripLength: "2",
    windowKey: "wknd",
  },
  {
    id: "multi-match",
    title: "Stack trips",
    icon: "git-compare-outline",
    category: "multiMatchTrips",
    tripLength: "2",
    windowKey: "d30",
  },
  {
    id: "night-games",
    title: "Night games",
    icon: "moon-outline",
    category: "nightMatches",
    vibe: "nightlife",
    windowKey: "d30",
  },
  {
    id: "value",
    title: "Value trips",
    icon: "cash-outline",
    category: "valueTrips",
    vibe: "easy",
    windowKey: "d60",
  },
];
