// src/data/cityGuides/index.ts
import type { CityGuide, CityTopThing } from "./types";
import { normalizeCityKey } from "@/src/utils/city";
import { teams } from "@/src/data/teams";
import { stadiums } from "@/src/data/stadiums";

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

type SimpleCityAuditRow = {
  cityKey: string;
  name?: string;
  country?: string;
};

type TeamCityAuditRow = {
  teamKey: string;
  teamName: string;
  cityKey: string;
  teamCity?: string;
  teamCountry?: string;
  guideName?: string;
  guideCountry?: string;
};

type StadiumCityAuditRow = {
  stadiumKey: string;
  stadiumName: string;
  cityKey: string;
  stadiumCity?: string;
  stadiumCountry?: string;
  guideName?: string;
  guideCountry?: string;
};

function cleanStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v || undefined;
}

function cleanStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const out = value
    .map((x) => cleanStr(x))
    .filter((x): x is string => !!x);

  return out.length ? Array.from(new Set(out)) : undefined;
}

function normalizeLoose(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

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

function normalizeTopThings(value: unknown): CityTopThing[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item) =>
        !!item &&
        typeof item === "object" &&
        typeof (item as CityTopThing).title === "string" &&
        typeof (item as CityTopThing).tip === "string" &&
        (item as CityTopThing).title.trim() &&
        (item as CityTopThing).tip.trim()
    )
    .map((item) => ({
      title: String((item as CityTopThing).title).trim(),
      tip: String((item as CityTopThing).tip).trim(),
    }));
}

function normalizeGuide(inputKey: string, guide: CityGuide): CityGuide {
  const cityId = normalizeCityKey(guide.cityId || inputKey);

  return {
    ...guide,
    cityId,
    name: cleanStr(guide.name) ?? cityId,
    country: cleanStr(guide.country) ?? "",
    overview: cleanStr(guide.overview) ?? "",
    thingsToDoUrl: cleanStr(guide.thingsToDoUrl),
    tripAdvisorTopThingsUrl: cleanStr(guide.tripAdvisorTopThingsUrl),
    topThings: normalizeTopThings(guide.topThings),
    tips: cleanStringArray(guide.tips) ?? [],
    food: cleanStringArray(guide.food),
    transport: cleanStr(guide.transport),
    accommodation: cleanStr(guide.accommodation),
  };
}

const SOURCE_MAP: Record<string, CityGuideMap> = {
  premierLeague: premierLeagueCityGuides,
  laLiga: laLigaCityGuides,
  bundesliga: bundesligaCityGuides,
  serieA: serieACityGuides,
  ligue1: ligue1CityGuides,
  primeiraLiga: primeiraLigaCityGuides,
  eredivisie: eredivisieCityGuides,
  scottishPremiership: scottishPremiershipCityGuides,
  superLig: superLigCityGuides,
  proLeague: proLeagueCityGuides,
  superLeagueGreece: superLeagueGreeceCityGuides,
  austrianBundesliga: austrianBundesligaCityGuides,
  swissSuperLeague: swissSuperLeagueCityGuides,
  superligaDenmark: superligaDenmarkCityGuides,
  czechFirstLeague: czechFirstLeagueCityGuides,
  ekstraklasa: ekstraklasaCityGuides,
  hnl: hnlCityGuides,
  superLiga: superLigaCityGuides,
  firstLeagueBulgaria: firstLeagueBulgariaCityGuides,
  firstDivisionCyprus: firstDivisionCyprusCityGuides,
  superLigaSerbia: superLigaSerbiaCityGuides,
  superLigaSlovakia: superLigaSlovakiaCityGuides,
  prvaLigaSlovenia: prvaLigaSloveniaCityGuides,
  nbI: nbICityGuides,
  allsvenskan: allsvenskanCityGuides,
  eliteserien: eliteserienCityGuides,
  veikkausliiga: veikkausliigaCityGuides,
  bestaDeild: bestaDeildCityGuides,
  premierLeagueBosnia: premierLeagueBosniaCityGuides,
  leagueOfIrelandPremier: leagueOfIrelandPremierCityGuides,
};

const duplicateCityKeys: Record<string, string[]> = {};
const invalidEntries: { source: string; rawKey: string }[] = {};

function buildCityGuideRegistry() {
  const merged: CityGuideMap = {};
  const bySource: Record<string, number> = {};

  for (const [sourceName, source] of Object.entries(SOURCE_MAP)) {
    bySource[sourceName] = 0;

    for (const [rawKey, rawGuide] of Object.entries(source)) {
      if (!isCityGuide(rawGuide)) {
        invalidEntries.push({ source: sourceName, rawKey });
        continue;
      }

      const normalized = normalizeGuide(rawKey, rawGuide);
      const key = normalized.cityId;

      if (!key) {
        invalidEntries.push({ source: sourceName, rawKey });
        continue;
      }

      if (merged[key]) {
        if (!duplicateCityKeys[key]) {
          duplicateCityKeys[key] = [sourceName];
        } else {
          duplicateCityKeys[key].push(sourceName);
        }
        continue;
      }

      merged[key] = normalized;
      bySource[sourceName] += 1;
    }
  }

  return { merged, bySource };
}

const { merged, bySource } = buildCityGuideRegistry();

export const cityGuides: CityGuideMap = merged;

export function getCityGuide(cityInput: string): CityGuide | null {
  const key = normalizeCityKey(cityInput);
  if (!key) return null;
  return cityGuides[key] ?? null;
}

export function hasCityGuide(cityInput: string): boolean {
  const key = normalizeCityKey(cityInput);
  return !!key && !!cityGuides[key];
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

export function getAllCityGuides(): CityGuide[] {
  return Object.values(cityGuides);
}

export function getCityGuidesDebugSnapshot() {
  const all = Object.values(cityGuides);

  const missingThingsToDoUrl = all
    .filter((guide) => !guide.thingsToDoUrl)
    .map((guide) => ({
      cityId: guide.cityId,
      name: guide.name,
      country: guide.country,
    }));

  const weakTopThings = all
    .filter((guide) => (guide.topThings?.length ?? 0) < 10)
    .map((guide) => ({
      cityId: guide.cityId,
      name: guide.name,
      country: guide.country,
      topThingsCount: guide.topThings?.length ?? 0,
    }));

  const weakTips = all
    .filter((guide) => (guide.tips?.length ?? 0) < 5)
    .map((guide) => ({
      cityId: guide.cityId,
      name: guide.name,
      country: guide.country,
      tipsCount: guide.tips?.length ?? 0,
    }));

  const missingFood = all
    .filter((guide) => !guide.food || guide.food.length === 0)
    .map((guide) => ({
      cityId: guide.cityId,
      name: guide.name,
      country: guide.country,
    }));

  const missingTransport = all
    .filter((guide) => !guide.transport)
    .map((guide) => ({
      cityId: guide.cityId,
      name: guide.name,
      country: guide.country,
    }));

  const missingAccommodation = all
    .filter((guide) => !guide.accommodation)
    .map((guide) => ({
      cityId: guide.cityId,
      name: guide.name,
      country: guide.country,
    }));

  const weakOverview = all
    .filter((guide) => (guide.overview?.trim().length ?? 0) < 140)
    .map((guide) => ({
      cityId: guide.cityId,
      name: guide.name,
      country: guide.country,
      overviewLength: guide.overview?.trim().length ?? 0,
    }));

  const teamCityKeysReferenced = new Set(
    Object.values(teams)
      .map((team) => normalizeCityKey(team.cityKey || team.city || ""))
      .filter(Boolean)
  );

  const stadiumCityKeysReferenced = new Set(
    Object.values(stadiums)
      .map((stadium) => normalizeCityKey(stadium.city))
      .filter(Boolean)
  );

  const guideKeys = new Set(Object.keys(cityGuides));

  const teamsMissingCityGuide: TeamCityAuditRow[] = Object.values(teams)
    .map((team) => {
      const cityKey = normalizeCityKey(team.cityKey || team.city || "");
      const guide = cityKey ? cityGuides[cityKey] : undefined;

      return {
        teamKey: team.teamKey,
        teamName: team.name,
        cityKey,
        teamCity: team.city,
        teamCountry: team.country,
        guideName: guide?.name,
        guideCountry: guide?.country,
      };
    })
    .filter((row) => row.cityKey && !cityGuides[row.cityKey])
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  const stadiumsMissingCityGuide: StadiumCityAuditRow[] = Object.values(stadiums)
    .map((stadium) => {
      const cityKey = normalizeCityKey(stadium.city);
      const guide = cityKey ? cityGuides[cityKey] : undefined;

      return {
        stadiumKey: stadium.stadiumKey,
        stadiumName: stadium.name,
        cityKey,
        stadiumCity: stadium.city,
        stadiumCountry: stadium.country,
        guideName: guide?.name,
        guideCountry: guide?.country,
      };
    })
    .filter((row) => row.cityKey && !cityGuides[row.cityKey])
    .sort((a, b) => a.stadiumName.localeCompare(b.stadiumName));

  const teamGuideNameMismatches: TeamCityAuditRow[] = Object.values(teams)
    .map((team) => {
      const cityKey = normalizeCityKey(team.cityKey || team.city || "");
      const guide = cityKey ? cityGuides[cityKey] : undefined;

      return {
        teamKey: team.teamKey,
        teamName: team.name,
        cityKey,
        teamCity: team.city,
        teamCountry: team.country,
        guideName: guide?.name,
        guideCountry: guide?.country,
      };
    })
    .filter(
      (row) =>
        !!row.cityKey &&
        !!row.guideName &&
        !!row.teamCity &&
        normalizeLoose(row.teamCity) !== normalizeLoose(row.guideName)
    )
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  const teamGuideCountryMismatches: TeamCityAuditRow[] = Object.values(teams)
    .map((team) => {
      const cityKey = normalizeCityKey(team.cityKey || team.city || "");
      const guide = cityKey ? cityGuides[cityKey] : undefined;

      return {
        teamKey: team.teamKey,
        teamName: team.name,
        cityKey,
        teamCity: team.city,
        teamCountry: team.country,
        guideName: guide?.name,
        guideCountry: guide?.country,
      };
    })
    .filter(
      (row) =>
        !!row.cityKey &&
        !!row.guideCountry &&
        !!row.teamCountry &&
        normalizeLoose(row.teamCountry) !== normalizeLoose(row.guideCountry)
    )
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  const stadiumGuideNameMismatches: StadiumCityAuditRow[] = Object.values(stadiums)
    .map((stadium) => {
      const cityKey = normalizeCityKey(stadium.city);
      const guide = cityKey ? cityGuides[cityKey] : undefined;

      return {
        stadiumKey: stadium.stadiumKey,
        stadiumName: stadium.name,
        cityKey,
        stadiumCity: stadium.city,
        stadiumCountry: stadium.country,
        guideName: guide?.name,
        guideCountry: guide?.country,
      };
    })
    .filter(
      (row) =>
        !!row.cityKey &&
        !!row.guideName &&
        !!row.stadiumCity &&
        normalizeLoose(row.stadiumCity) !== normalizeLoose(row.guideName)
    )
    .sort((a, b) => a.stadiumName.localeCompare(b.stadiumName));

  const stadiumGuideCountryMismatches: StadiumCityAuditRow[] = Object.values(stadiums)
    .map((stadium) => {
      const cityKey = normalizeCityKey(stadium.city);
      const guide = cityKey ? cityGuides[cityKey] : undefined;

      return {
        stadiumKey: stadium.stadiumKey,
        stadiumName: stadium.name,
        cityKey,
        stadiumCity: stadium.city,
        stadiumCountry: stadium.country,
        guideName: guide?.name,
        guideCountry: guide?.country,
      };
    })
    .filter(
      (row) =>
        !!row.cityKey &&
        !!row.guideCountry &&
        !!row.stadiumCountry &&
        normalizeLoose(row.stadiumCountry) !== normalizeLoose(row.guideCountry)
    )
    .sort((a, b) => a.stadiumName.localeCompare(b.stadiumName));

  const guideKeysUnusedByTeams: SimpleCityAuditRow[] = Object.values(cityGuides)
    .filter((guide) => !teamCityKeysReferenced.has(guide.cityId))
    .map((guide) => ({
      cityKey: guide.cityId,
      name: guide.name,
      country: guide.country,
    }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const guideKeysUnusedByStadiums: SimpleCityAuditRow[] = Object.values(cityGuides)
    .filter((guide) => !stadiumCityKeysReferenced.has(guide.cityId))
    .map((guide) => ({
      cityKey: guide.cityId,
      name: guide.name,
      country: guide.country,
    }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const referencedCityKeysMissingGuide: SimpleCityAuditRow[] = Array.from(
    new Set([...teamCityKeysReferenced, ...stadiumCityKeysReferenced])
  )
    .filter((cityKey) => cityKey && !guideKeys.has(cityKey))
    .map((cityKey) => ({ cityKey }))
    .sort((a, b) => a.cityKey.localeCompare(b.cityKey));

  return {
    count: all.length,
    bySource,
    duplicates: Object.entries(duplicateCityKeys).map(([cityId, sources]) => ({
      cityId,
      duplicateSources: sources,
      count: sources.length + 1,
    })),
    invalidEntries,
    missingThingsToDoUrl,
    weakTopThings,
    weakTips,
    missingFood,
    missingTransport,
    missingAccommodation,
    weakOverview,
    audits: {
      teamsMissingCityGuide,
      stadiumsMissingCityGuide,
      teamGuideNameMismatches,
      teamGuideCountryMismatches,
      stadiumGuideNameMismatches,
      stadiumGuideCountryMismatches,
      guideKeysUnusedByTeams,
      guideKeysUnusedByStadiums,
      referencedCityKeysMissingGuide,
    },
  };
}

export default cityGuides;
