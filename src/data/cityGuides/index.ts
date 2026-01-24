// src/data/cityGuides/index.ts
import type { CityGuide, CityTopThing } from "./types";
import { normalizeCityKey } from "@/src/utils/city";
import cityGuides from "./cityGuides";

export type TripTopThingsBundle = {
  cityKey: string;
  hasGuide: boolean;
  tripAdvisorUrl?: string;
  items: { title: string; description?: string }[];
  quickTips: string[];
};

/**
 * Used in Trip Build panel.
 * Returns a lightweight bundle for "Top things to do" + a TripAdvisor link.
 */
export function getTopThingsToDoForTrip(cityInput: string): TripTopThingsBundle {
  const cityKey = normalizeCityKey(cityInput);
  const guide = cityGuides[cityKey];

  if (!guide) {
    return {
      cityKey,
      hasGuide: false,
      tripAdvisorUrl: undefined,
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

export { cityGuides };
export default cityGuides;
