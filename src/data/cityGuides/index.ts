import type { CityGuide, CityTopThing } from "./types";
import { normalizeCityKey } from "@/src/utils/city";

import premierLeagueCityGuides from "./premierLeague";
import laLigaCityGuides from "./laLiga";
import bundesligaCityGuides from "./bundesliga";
import serieACityGuides from "./serieA";
import ligue1CityGuides from "./ligue1";

export type TripTopThingsBundle = {
  cityKey: string;
  hasGuide: boolean;
  tripAdvisorUrl?: string;
  items: { title: string; description?: string }[];
  quickTips: string[];
};

/**
 * Unified registry
 */
export const cityGuides: Record<string, CityGuide> = {
  ...premierLeagueCityGuides,
  ...laLigaCityGuides,
  ...bundesligaCityGuides,
  ...serieACityGuides,
  ...ligue1CityGuides,
};

/**
 * Find a city guide by any user input
 */
export function getCityGuide(cityInput: string): CityGuide | null {
  const key = normalizeCityKey(cityInput);
  return cityGuides[key] ?? null;
}

/**
 * Used in Trip Build panel
 */
export function getTopThingsToDoForTrip(cityInput: string): TripTopThingsBundle {
  const cityKey = normalizeCityKey(cityInput);
  const guide = cityGuides[cityKey];

  if (!guide) {
    return {
      cityKey,
      hasGuide: false,
      items: [],
      quickTips: [],
    };
  }

  const items = (guide.topThings ?? []).slice(0, 10).map((x: CityTopThing) => ({
    title: x.title,
    description: x.tip,
  }));

  return {
    cityKey,
    hasGuide: true,
    tripAdvisorUrl: guide.tripAdvisorTopThingsUrl,
    items,
    quickTips: (guide.tips ?? []).slice(0, 8),
  };
}

export default cityGuides;
