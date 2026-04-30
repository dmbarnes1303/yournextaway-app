import type { FixtureListRow } from "@/src/services/apiFootball";
import type {
  DiscoverFixture,
  DiscoverTripLength,
  DiscoverVibe,
} from "./discoverEngine";
import type { DiscoverCategory } from "./discoverCategories";
import type { Ionicons } from "@expo/vector-icons";

/* -------------------------------------------------------------------------- */
/* Core time window                                                           */
/* -------------------------------------------------------------------------- */

export type ShortcutWindow = {
  from: string;
  to: string;
};

export type DiscoverWindowKey =
  | "wknd"
  | "d7"
  | "d14"
  | "d30"
  | "d60"
  | "d90";

/* -------------------------------------------------------------------------- */
/* Ranked output                                                              */
/* -------------------------------------------------------------------------- */

export type RankedDiscoverPick = {
  item: DiscoverFixture;
  score: number;

  // 🔥 future-proof: lets UI show WHY this ranked high without recomputing
  reasons?: string[];
};

/* -------------------------------------------------------------------------- */
/* UI Presets (Inspiration / Quick entry)                                     */
/* -------------------------------------------------------------------------- */

export type BasePreset = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;

  category: DiscoverCategory;

  vibe?: DiscoverVibe;
  windowKey?: DiscoverWindowKey;
  tripLength?: DiscoverTripLength;

  // 🔥 optional: lets you show small subtext chips later
  hint?: string;
};

export type InspirationPreset = BasePreset & {
  subtitle: string;
};

export type QuickSpark = BasePreset;

/* -------------------------------------------------------------------------- */
/* Multi-match trips                                                          */
/* -------------------------------------------------------------------------- */

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

  // 🔥 important: UI + logic upgrade
  // lets you show “why this works” without recompute
  reasons?: string[];

  // 🔥 important: for future sorting/filtering
  avgScore?: number;
};
