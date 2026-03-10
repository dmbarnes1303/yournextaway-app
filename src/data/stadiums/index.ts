// src/data/stadiums/index.ts
import type { StadiumRecord, StadiumStayArea, StadiumTransit } from "./types";

import premierLeagueStadiums from "./premierLeague";
import laLigaStadiums from "./laLiga";
import serieAStadiums from "./serieA";
import bundesligaStadiums from "./bundesliga";
import ligue1Stadiums from "./ligue1";
import primeiraLigaStadiums from "./primeiraLiga";
import eredivisieStadiums from "./eredivisie";
import scottishPremiershipStadiums from "./scottishPremiership";
import superLigStadiums from "./superLig";
import proLeagueStadiums from "./proLeague";
import superLeagueGreeceStadiums from "./superLeagueGreece";
import austrianBundesligaStadiums from "./austrianBundesliga";
import superligaDenmarkStadiums from "./superligaDenmark";
import swissSuperLeagueStadiums from "./swissSuperLeague";
import czechFirstLeagueStadiums from "./czechFirstLeague";
import ekstraklasaStadiums from "./ekstraklasa";
import allsvenskanStadiums from "./allsvenskan";
import eliteserienStadiums from "./eliteserien";
import veikkausliigaStadiums from "./veikkausliiga";
import bestaDeildStadiums from "./bestaDeild";
import nbIStadiums from "./nbI";
import superLigaStadiums from "./superLiga";
import hnlStadiums from "./hnl";
import superLigaSerbiaStadiums from "./superLigaSerbia";
import superLigaSlovakiaStadiums from "./superLigaSlovakia";
import prvaLigaSloveniaStadiums from "./prvaLigaSlovenia";
import firstLeagueBulgariaStadiums from "./firstLeagueBulgaria";
import firstDivisionCyprusStadiums from "./firstDivisionCyprus";
import premierLeagueBosniaStadiums from "./premierLeagueBosnia";
import leagueOfIrelandPremierStadiums from "./leagueOfIrelandPremier";

type StadiumMap = Record<string, StadiumRecord>;

function cleanStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v || undefined;
}

function cleanNum(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeKey(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeTransitItem(item: StadiumTransit): StadiumTransit | null {
  const label = cleanStr(item?.label);
  if (!label) return null;

  const minutes = cleanNum(item?.minutes);
  const note = cleanStr(item?.note);

  return {
    label,
    minutes,
    note,
  };
}

function normalizeStayArea(item: StadiumStayArea): StadiumStayArea | null {
  const area = cleanStr(item?.area);
  const why = cleanStr(item?.why);

  if (!area || !why) return null;

  return {
    area,
    why,
  };
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const out = value
    .map((x) => cleanStr(x))
    .filter((x): x is string => !!x);

  return out.length ? out : undefined;
}

function isStadiumRecord(value: unknown): value is StadiumRecord {
  if (!value || typeof value !== "object") return false;

  const v = value as Partial<StadiumRecord>;

  return (
    typeof v.stadiumKey === "string" &&
    typeof v.name === "string" &&
    typeof v.city === "string" &&
    typeof v.country === "string" &&
    Array.isArray(v.teamKeys)
  );
}

function normalizeStadium(inputKey: string, stadium: StadiumRecord): StadiumRecord {
  const stadiumKey = normalizeKey(stadium.stadiumKey || inputKey);

  return {
    stadiumKey,
    name: cleanStr(stadium.name) ?? stadiumKey,
    city: cleanStr(stadium.city) ?? "",
    country: cleanStr(stadium.country) ?? "",
    teamKeys: Array.isArray(stadium.teamKeys)
      ? Array.from(
          new Set(
            stadium.teamKeys
              .map((teamKey) => normalizeKey(teamKey))
              .filter(Boolean)
          )
        )
      : [],
    address: cleanStr(stadium.address),
    capacity: cleanNum(stadium.capacity),
    opened: cleanNum(stadium.opened),
    airport: cleanStr(stadium.airport),
    distanceFromAirportKm: cleanNum(stadium.distanceFromAirportKm),
    tips: normalizeStringArray(stadium.tips),
    transit: Array.isArray(stadium.transit)
      ? stadium.transit
          .map((item) => normalizeTransitItem(item))
          .filter((item): item is StadiumTransit => !!item)
      : undefined,
    stayAreas: Array.isArray(stadium.stayAreas)
      ? stadium.stayAreas
          .map((item) => normalizeStayArea(item))
          .filter((item): item is StadiumStayArea => !!item)
      : undefined,
    officialInfoUrl: cleanStr(stadium.officialInfoUrl),
  };
}

const SOURCE_MAP: Record<string, StadiumMap> = {
  premierLeague: premierLeagueStadiums,
  laLiga: laLigaStadiums,
  serieA: serieAStadiums,
  bundesliga: bundesligaStadiums,
  ligue1: ligue1Stadiums,
  primeiraLiga: primeiraLigaStadiums,
  eredivisie: eredivisieStadiums,
  scottishPremiership: scottishPremiershipStadiums,
  superLig: superLigStadiums,
  proLeague: proLeagueStadiums,
  superLeagueGreece: superLeagueGreeceStadiums,
  austrianBundesliga: austrianBundesligaStadiums,
  superligaDenmark: superligaDenmarkStadiums,
  swissSuperLeague: swissSuperLeagueStadiums,
  czechFirstLeague: czechFirstLeagueStadiums,
  ekstraklasa: ekstraklasaStadiums,
  allsvenskan: allsvenskanStadiums,
  eliteserien: eliteserienStadiums,
  veikkausliiga: veikkausliigaStadiums,
  bestaDeild: bestaDeildStadiums,
  nbI: nbIStadiums,
  superLiga: superLigaStadiums,
  hnl: hnlStadiums,
  superLigaSerbia: superLigaSerbiaStadiums,
  superLigaSlovakia: superLigaSlovakiaStadiums,
  prvaLigaSlovenia: prvaLigaSloveniaStadiums,
  firstLeagueBulgaria: firstLeagueBulgariaStadiums,
  firstDivisionCyprus: firstDivisionCyprusStadiums,
  premierLeagueBosnia: premierLeagueBosniaStadiums,
  leagueOfIrelandPremier: leagueOfIrelandPremierStadiums,
};

const duplicateStadiumKeys: Record<string, string[]> = {};
const invalidEntries: { source: string; rawKey: string }[] = {};

function buildStadiumRegistry() {
  const merged: StadiumMap = {};
  const bySource: Record<string, number> = {};

  for (const [sourceName, source] of Object.entries(SOURCE_MAP)) {
    bySource[sourceName] = 0;

    for (const [rawKey, rawValue] of Object.entries(source)) {
      if (!isStadiumRecord(rawValue)) {
        invalidEntries.push({ source: sourceName, rawKey });
        continue;
      }

      const normalized = normalizeStadium(rawKey, rawValue);
      if (!normalized.stadiumKey) {
        invalidEntries.push({ source: sourceName, rawKey });
        continue;
      }

      if (merged[normalized.stadiumKey]) {
        if (!duplicateStadiumKeys[normalized.stadiumKey]) {
          duplicateStadiumKeys[normalized.stadiumKey] = [sourceName];
        } else {
          duplicateStadiumKeys[normalized.stadiumKey].push(sourceName);
        }
        continue;
      }

      merged[normalized.stadiumKey] = normalized;
      bySource[sourceName] += 1;
    }
  }

  return { merged, bySource };
}

const { merged, bySource } = buildStadiumRegistry();

export const stadiums: StadiumMap = merged;

export function getStadium(stadiumKey: string): StadiumRecord | null {
  const key = normalizeKey(stadiumKey);
  if (!key) return null;
  return stadiums[key] ?? null;
}

export function getStadiumByTeam(teamKey: string): StadiumRecord | null {
  const key = normalizeKey(teamKey);
  if (!key) return null;

  return (
    Object.values(stadiums).find((stadium) =>
      stadium.teamKeys.some((team) => normalizeKey(team) === key)
    ) ?? null
  );
}

export function getStadiumsByCountry(country: string): StadiumRecord[] {
  const value = normalizeKey(country);
  if (!value) return [];

  return Object.values(stadiums).filter(
    (stadium) => normalizeKey(stadium.country) === value
  );
}

export function getStadiumsByCity(city: string): StadiumRecord[] {
  const value = normalizeKey(city);
  if (!value) return [];

  return Object.values(stadiums).filter(
    (stadium) => normalizeKey(stadium.city) === value
  );
}

export function hasStadium(stadiumKey: string): boolean {
  return !!getStadium(stadiumKey);
}

export function getAllStadiums(): StadiumRecord[] {
  return Object.values(stadiums);
}

export function getStadiumsDebugSnapshot() {
  const all = Object.values(stadiums);

  return {
    count: all.length,
    bySource,
    duplicates: Object.entries(duplicateStadiumKeys).map(([stadiumKey, sources]) => ({
      stadiumKey,
      duplicateSources: sources,
      count: sources.length + 1,
    })),
    invalidEntries,
    missingAirport: all
      .filter((stadium) => !stadium.airport)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
      })),
    missingDistanceFromAirport: all
      .filter((stadium) => stadium.airport && stadium.distanceFromAirportKm == null)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
      })),
    missingTransit: all
      .filter((stadium) => !stadium.transit || stadium.transit.length === 0)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
      })),
    weakTransit: all
      .filter((stadium) => (stadium.transit?.length ?? 0) > 0 && (stadium.transit?.length ?? 0) < 2)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
        transitCount: stadium.transit?.length ?? 0,
      })),
    missingStayAreas: all
      .filter((stadium) => !stadium.stayAreas || stadium.stayAreas.length === 0)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
      })),
    weakStayAreas: all
      .filter((stadium) => (stadium.stayAreas?.length ?? 0) > 0 && (stadium.stayAreas?.length ?? 0) < 2)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
        stayAreasCount: stadium.stayAreas?.length ?? 0,
      })),
    missingCapacity: all
      .filter((stadium) => stadium.capacity == null)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
      })),
    missingOpened: all
      .filter((stadium) => stadium.opened == null)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
      })),
    missingTips: all
      .filter((stadium) => !stadium.tips || stadium.tips.length === 0)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
      })),
    missingTeamKeys: all
      .filter((stadium) => !stadium.teamKeys || stadium.teamKeys.length === 0)
      .map((stadium) => ({
        stadiumKey: stadium.stadiumKey,
        name: stadium.name,
        city: stadium.city,
        country: stadium.country,
      })),
  };
}

export type { StadiumRecord } from "./types";

export {
  premierLeagueStadiums,
  laLigaStadiums,
  serieAStadiums,
  bundesligaStadiums,
  ligue1Stadiums,
};

export default stadiums;
