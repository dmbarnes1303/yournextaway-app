// src/features/discover/discoverUtils.ts

import {
  nextWeekendWindowIso,
  windowFromTomorrowIso,
} from "@/src/constants/football";
import type { DiscoverCategory } from "./discoverCategories";
import type { DiscoverTripLength, DiscoverVibe } from "./discoverEngine";
import type {
  DiscoverWindowKey,
  ShortcutWindow,
} from "./types";

export { fetchDiscoverPool } from "./discoverPoolBuilder";
export { buildMultiMatchTrips, comboWhy } from "./discoverTripBuilder";
export {
  fixtureTitle,
  fixtureMeta,
  whyThisFits,
  trendingLabelForFixture,
  rankLabel,
  trendingScore,
  fixtureIsoDateOnly,
  isMidweekFixture,
  isLateKickoff,
  isWeekendFixture,
  isEuropeanCompetition,
} from "./discoverPresentation";

export function labelForKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "This Weekend";
  if (key === "d7") return "Next 7 Days";
  if (key === "d14") return "Next 14 Days";
  if (key === "d30") return "Next 30 Days";
  if (key === "d60") return "Next 60 Days";
  return "Next 90 Days";
}

export function shortLabelForKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "Weekend";
  if (key === "d7") return "7 Days";
  if (key === "d14") return "14 Days";
  if (key === "d30") return "30 Days";
  if (key === "d60") return "60 Days";
  return "90 Days";
}

export function labelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day Trip";
  if (v === "1") return "1 Night";
  if (v === "2") return "2 Nights";
  return "3 Nights";
}

export function shortLabelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day";
  if (v === "1") return "1N";
  if (v === "2") return "2N";
  return "3N";
}

export function labelForVibe(v: DiscoverVibe) {
  if (v === "easy") return "Easy Travel";
  if (v === "big") return "Big Match";
  if (v === "nightlife") return "Nightlife";
  if (v === "culture") return "Culture";
  return "Warm-ish";
}

export function shortLabelForVibe(v: DiscoverVibe) {
  if (v === "easy") return "Easy";
  if (v === "big") return "Big";
  if (v === "nightlife") return "Night";
  if (v === "culture") return "Culture";
  return "Warm";
}

export function windowForKey(key: DiscoverWindowKey): ShortcutWindow {
  if (key === "wknd") return nextWeekendWindowIso();
  if (key === "d7") return windowFromTomorrowIso(7);
  if (key === "d14") return windowFromTomorrowIso(14);
  if (key === "d30") return windowFromTomorrowIso(30);
  if (key === "d60") return windowFromTomorrowIso(60);
  return windowFromTomorrowIso(90);
}

export function pickRandom<T>(arr: T[]): T | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)] ?? null;
}

export function clampVibes(next: DiscoverVibe[]) {
  if (next.length <= 3) return next;
  return next.slice(next.length - 3);
}

export function categorySeedFromFilters(params: {
  vibes: DiscoverVibe[];
  windowKey: DiscoverWindowKey;
  tripLength: DiscoverTripLength;
}): DiscoverCategory {
  const { vibes, windowKey, tripLength } = params;

  if (windowKey === "wknd") return "weekendTrips";
  if (tripLength === "2" || tripLength === "3") return "multiMatchTrips";
  if (vibes.includes("big")) return "bigMatches";
  if (vibes.includes("nightlife")) return "nightMatches";
  if (vibes.includes("culture")) return "matchdayCulture";
  if (vibes.includes("warm")) return "iconicCities";
  if (vibes.includes("easy")) return "easyTickets";
  return "perfectTrips";
}

export function prioritiseCategories(
  categories: DiscoverCategory[],
  preferred: DiscoverCategory
): DiscoverCategory[] {
  const deduped = categories.filter(
    (category, index) => categories.indexOf(category) === index
  );
  const withoutPreferred = deduped.filter((category) => category !== preferred);
  return deduped.includes(preferred) ? [preferred, ...withoutPreferred] : deduped;
}
