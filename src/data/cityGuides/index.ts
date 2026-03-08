import type { CityGuide, CityTopThing } from "./types";
import { normalizeCityKey } from "@/src/utils/city";

import premierLeagueCityGuides from "./premierLeague";
import laLigaCityGuides from "./laLiga";
import bundesligaCityGuides from "./bundesliga";
import serieACityGuides from "./serieA";
import ligue1CityGuides from "./ligue1";
import primeiraLigaCityGuides from "./primeiraLiga";
import eredivisieCityGuides from "./eredivisie";
import scottishPremiershipCityGuides from "./scottishPremiership";
import superLigCityGuides from "./superLig";
import superLeagueGreeceCityGuides from "./superLeagueGreece";

export type TripTopThingsBundle = {
  cityKey: string;
  hasGuide: boolean;
  thingsToDoUrl?: string;
  items: { title: string; description?: string }[];
  quickTips: string[];
};

export const cityGuides: Record<string, CityGuide> = {
  ...premierLeagueCityGuides,
  ...laLigaCityGuides,
  ...bundesligaCityGuides,
  ...serieACityGuides,
  ...ligue1CityGuides,
  ...primeiraLigaCityGuides,
  ...eredivisieCityGuides,
  ...scottishPremiershipCityGuides,
  ...superLigCityGuides,
  ...superLeagueGreeceCityGuides,
};

export function getCityGuide(cityInput: string): CityGuide | null {
  const key = normalizeCityKey(cityInput);
  return cityGuides[key] ?? null;
}

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
    thingsToDoUrl: guide.thingsToDoUrl || undefined,
    items,
    quickTips: (guide.tips ?? []).slice(0, 8),
  };
}

export default cityGuides;
