import type { FixtureListRow } from "@/src/services/apiFootball";
import type {
  DiscoverFixture,
  DiscoverTripLength,
  DiscoverVibe,
} from "./discoverEngine";
import type { DiscoverCategory } from "./discoverCategories";
import type { Ionicons } from "@expo/vector-icons";

export type ShortcutWindow = {
  from: string;
  to: string;
};

export type DiscoverWindowKey = "wknd" | "d7" | "d14" | "d30" | "d60" | "d90";

export type RankedDiscoverPick = {
  item: DiscoverFixture;
  score: number;
};

export type InspirationPreset = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  vibe?: DiscoverVibe;
  category: DiscoverCategory;
  windowKey?: DiscoverWindowKey;
  tripLength?: DiscoverTripLength;
};

export type QuickSpark = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: DiscoverCategory;
  vibe?: DiscoverVibe;
  windowKey?: DiscoverWindowKey;
  tripLength?: DiscoverTripLength;
};

export type MultiMatchTrip = {
  id: string;
  title: string;
  subtitle: string;
  score: number;
  matchCount: number;
  daysSpan: number;
  from: string;
  to: string;
  cityLabel: string;
  countryLabel: string;
  style: "same-city" | "nearby-cities" | "country-run";
  fixtureIds: string[];
  rows: FixtureListRow[];
  labels: string[];
};
