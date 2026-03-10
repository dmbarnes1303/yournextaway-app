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
import proLeagueCityGuides from "./proLeague";
import superLeagueGreeceCityGuides from "./superLeagueGreece";
import austrianBundesligaCityGuides from "./austrianBundesliga";
import swissSuperLeagueCityGuides from "./swissSuperLeague";
import superligaDenmarkCityGuides from "./superligaDenmark";
import czechFirstLeagueCityGuides from "./czechFirstLeague";
import ekstraklasaCityGuides from "./ekstraklasa";
import hnlCityGuides from "./hnl";
import superLigaCityGuides from "./superLiga";
import firstLeagueBulgariaCityGuides from "./firstLeagueBulgaria";
import firstDivisionCyprusCityGuides from "./firstDivisionCyprus";
import superLigaSerbiaCityGuides from "./superLigaSerbia";
import superLigaSlovakiaCityGuides from "./superLigaSlovakia";
import prvaLigaSloveniaCityGuides from "./prvaLigaSlovenia";
import nbICityGuides from "./nbI";
import allsvenskanCityGuides from "./allsvenskan";
import eliteserienCityGuides from "./eliteserien";
import veikkausliigaCityGuides from "./veikkausliiga";
import bestaDeildCityGuides from "./bestaDeild";
import premierLeagueBosniaCityGuides from "./premierLeagueBosnia";
import leagueOfIrelandPremierCityGuides from "./leagueOfIrelandPremier";

export type TripTopThingsBundle = {
  cityKey: string;
  hasGuide: boolean;
  thingsToDoUrl?: string;
  items: { title: string; description?: string }[];
  quickTips: string[];
};

type CityGuideMap = Record<string, CityGuide>;

function isCityGuide(value: unknown): value is CityGuide {
  if (!value || typeof value !== "object") return false;

  const v = value as Partial<CityGuide>;

  return (
    typeof v.cityId === "string" &&
    typeof v.name === "string" &&
    typeof v.country === "string" &&
    typeof v.overview === "string" &&
    Array.isArray(v.topThings) &&
    Array.isArray(v.tips)
  );
}

function normalizeGuide(inputKey: string, guide: CityGuide): CityGuide {
  const normalizedKey = normalizeCityKey(guide.cityId || inputKey);

  return {
    ...guide,
    cityId: normalizedKey,
    name: String(guide.name ?? "").trim(),
    country: String(guide.country ?? "").trim(),
    overview: String(guide.overview ?? "").trim(),
    thingsToDoUrl: guide.thingsToDoUrl ? String(guide.thingsToDoUrl).trim() : undefined,
    tripAdvisorTopThingsUrl: guide.tripAdvisorTopThingsUrl
      ? String(guide.tripAdvisorTopThingsUrl).trim()
      : undefined,
    topThings: Array.isArray(guide.topThings)
      ? guide.topThings
          .filter(
            (item) =>
              !!item &&
              typeof item.title === "string" &&
              typeof item.tip === "string" &&
              item.title.trim() &&
              item.tip.trim()
          )
          .map((item) => ({
            title: item.title.trim(),
            tip: item.tip.trim(),
          }))
      : [],
    tips: Array.isArray(guide.tips)
      ? guide.tips
          .filter((tip) => typeof tip === "string" && tip.trim())
          .map((tip) => tip.trim())
      : [],
    food: Array.isArray(guide.food)
      ? guide.food
          .filter((item) => typeof item === "string" && item.trim())
          .map((item) => item.trim())
      : undefined,
    transport: guide.transport ? String(guide.transport).trim() : undefined,
    accommodation: guide.accommodation ? String(guide.accommodation).trim() : undefined,
  };
}

function mergeGuideSources(...sources: CityGuideMap[]): CityGuideMap {
  const merged: CityGuideMap = {};

  for (const source of sources) {
    for (const [rawKey, rawGuide] of Object.entries(source)) {
      if (!isCityGuide(rawGuide)) continue;

      const normalizedKey = normalizeCityKey(rawGuide.cityId || rawKey);
      if (!normalizedKey) continue;

      merged[normalizedKey] = normalizeGuide(rawKey, rawGuide);
    }
  }

  return merged;
}

export const cityGuides: CityGuideMap = mergeGuideSources(
  premierLeagueCityGuides,
  laLigaCityGuides,
  bundesligaCityGuides,
  serieACityGuides,
  ligue1CityGuides,
  primeiraLigaCityGuides,
  eredivisieCityGuides,
  scottishPremiershipCityGuides,
  superLigCityGuides,
  proLeagueCityGuides,
  superLeagueGreeceCityGuides,
  austrianBundesligaCityGuides,
  swissSuperLeagueCityGuides,
  superligaDenmarkCityGuides,
  czechFirstLeagueCityGuides,
  ekstraklasaCityGuides,
  hnlCityGuides,
  superLigaCityGuides,
  firstLeagueBulgariaCityGuides,
  firstDivisionCyprusCityGuides,
  superLigaSerbiaCityGuides,
  superLigaSlovakiaCityGuides,
  prvaLigaSloveniaCityGuides,
  nbICityGuides,
  allsvenskanCityGuides,
  eliteserienCityGuides,
  veikkausliigaCityGuides,
  bestaDeildCityGuides,
  premierLeagueBosniaCityGuides,
  leagueOfIrelandPremierCityGuides
);

export function getCityGuide(cityInput: string): CityGuide | null {
  const key = normalizeCityKey(cityInput);
  if (!key) return null;
  return cityGuides[key] ?? null;
}

export function getTopThingsToDoForTrip(cityInput: string): TripTopThingsBundle {
  const cityKey = normalizeCityKey(cityInput);
  const guide = cityKey ? cityGuides[cityKey] : null;

  if (!cityKey || !guide) {
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

export function hasCityGuide(cityInput: string): boolean {
  const key = normalizeCityKey(cityInput);
  return !!key && !!cityGuides[key];
}

export function getCityGuidesDebugSnapshot() {
  const all = Object.values(cityGuides);

  return {
    count: all.length,
    missingThingsToDoUrl: all
      .filter((guide) => !guide.thingsToDoUrl)
      .map((guide) => ({
        cityId: guide.cityId,
        name: guide.name,
        country: guide.country,
      })),
    weakTopThingsCount: all.filter((guide) => (guide.topThings?.length ?? 0) < 10).length,
    weakTipsCount: all.filter((guide) => (guide.tips?.length ?? 0) < 5).length,
  };
}

export default cityGuides;
