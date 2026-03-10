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
  return String(value ?? "")
    .trim()
    .toLowerCase();
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
      ? stadium.teamKeys
          .map((teamKey) => normalizeKey(teamKey))
          .filter(Boolean)
      : [],
    address: cleanStr(stadium.address),
    capacity: cleanNum(stadium.capacity),
    opened: cleanNum(stadium.opened),
    airport: cleanStr(stadium.airport),
    distanceFromAirportKm: cleanNum(stadium.distanceFromAirportKm),
    tips: Array.isArray(stadium.tips)
      ? stadium.tips
          .map((tip) => cleanStr(tip))
          .filter((tip): tip is string => !!tip)
      : undefined,
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

function mergeStadiumSources(...sources: StadiumMap[]): StadiumMap {
  const merged: StadiumMap = {};

  for (const source of sources) {
    for (const [rawKey, rawValue] of Object.entries(source)) {
      if (!isStadiumRecord(rawValue)) continue;

      const normalized = normalizeStadium(rawKey, rawValue);
      if (!normalized.stadiumKey) continue;

      merged[normalized.stadiumKey] = normalized;
    }
  }

  return merged;
}

export const stadiums: StadiumMap = mergeStadiumSources(
  premierLeagueStadiums,
  laLigaStadiums,
  serieAStadiums,
  bundesligaStadiums,
  ligue1Stadiums,
  primeiraLigaStadiums,
  eredivisieStadiums,
  scottishPremiershipStadiums,
  superLigStadiums,
  proLeagueStadiums,
  superLeagueGreeceStadiums,
  austrianBundesligaStadiums,
  superligaDenmarkStadiums,
  swissSuperLeagueStadiums,
  czechFirstLeagueStadiums,
  ekstraklasaStadiums,
  allsvenskanStadiums,
  eliteserienStadiums,
  veikkausliigaStadiums,
  bestaDeildStadiums,
  nbIStadiums,
  superLigaStadiums,
  hnlStadiums,
  superLigaSerbiaStadiums,
  superLigaSlovakiaStadiums,
  prvaLigaSloveniaStadiums,
  firstLeagueBulgariaStadiums,
  firstDivisionCyprusStadiums,
  premierLeagueBosniaStadiums,
  leagueOfIrelandPremierStadiums
);

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

export function getStadiumsDebugSnapshot() {
  const all = Object.values(stadiums);

  return {
    count: all.length,
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
    missingStayAreas: all
      .filter((stadium) => !stadium.stayAreas || stadium.stayAreas.length === 0)
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
