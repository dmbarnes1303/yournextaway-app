// src/data/teams/index.ts
import { LEAGUES, type LeagueOption } from "@/src/constants/football";
import type { TeamRecord } from "./types";

import premierLeagueTeams from "./premierLeague";
import laLigaTeams from "./laLiga";
import serieATeams from "./serieA";
import bundesligaTeams from "./bundesliga";
import ligue1Teams from "./ligue1";
import primeiraLigaTeams from "./primeiraLiga";
import eredivisieTeams from "./eredivisie";
import scottishPremiershipTeams from "./scottishPremiership";
import superLigTeams from "./superLig";
import proLeagueTeams from "./proLeague";
import superLeagueGreeceTeams from "./superLeagueGreece";
import austrianBundesligaTeams from "./austrianBundesliga";
import superligaDenmarkTeams from "./superligaDenmark";
import swissSuperLeagueTeams from "./swissSuperLeague";
import czechFirstLeagueTeams from "./czechFirstLeague";
import ekstraklasaTeams from "./ekstraklasa";
import allsvenskanTeams from "./allsvenskan";
import eliteserienTeams from "./eliteserien";
import veikkausliigaTeams from "./veikkausliiga";
import bestaDeildTeams from "./bestaDeild";
import nbITeams from "./nbI";
import superLigaTeams from "./superLiga";
import hnlTeams from "./hnl";
import superLigaSerbiaTeams from "./superLigaSerbia";
import superLigaSlovakiaTeams from "./superLigaSlovakia";
import prvaLigaSloveniaTeams from "./prvaLigaSlovenia";
import firstLeagueBulgariaTeams from "./firstLeagueBulgaria";
import firstDivisionCyprusTeams from "./firstDivisionCyprus";
import premierLeagueBosniaTeams from "./premierLeagueBosnia";
import leagueOfIrelandPremierTeams from "./leagueOfIrelandPremier";

type TeamMap = Record<string, TeamRecord>;

export const POPULAR_TEAM_KEYS = [
  "real-madrid",
  "arsenal",
  "bayern-munich",
  "inter",
  "borussia-dortmund",
] as const;

export type PopularTeamKey = (typeof POPULAR_TEAM_KEYS)[number];

function stripDiacritics(input: string): string {
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return input;
  }
}

export function normalizeTeamKey(input: string): string {
  const s = stripDiacritics(String(input ?? ""))
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "");

  return s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCityKey(input: string): string {
  const s = stripDiacritics(String(input ?? ""))
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "");

  return s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v || undefined;
}

function cleanNum(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function isTeamRecord(value: unknown): value is TeamRecord {
  if (!value || typeof value !== "object") return false;

  const v = value as Partial<TeamRecord>;
  return typeof v.teamKey === "string" && typeof v.name === "string";
}

function normalizeAliases(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const out = value
    .map((x) => cleanStr(x))
    .filter((x): x is string => !!x);

  return out.length ? Array.from(new Set(out)) : undefined;
}

function normalizeClubColors(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const out = value
    .map((x) => cleanStr(x))
    .filter((x): x is string => !!x);

  return out.length ? Array.from(new Set(out)) : undefined;
}

function normalizeTeam(inputKey: string, team: TeamRecord): TeamRecord {
  const teamKey = normalizeTeamKey(team.teamKey || inputKey);
  const city = cleanStr(team.city);
  const explicitCityKey = cleanStr(team.cityKey);
  const cityKey = explicitCityKey
    ? normalizeCityKey(explicitCityKey)
    : city
      ? normalizeCityKey(city)
      : undefined;

  return {
    teamKey,
    teamId: cleanNum(team.teamId),
    name: cleanStr(team.name) ?? teamKey,
    country: cleanStr(team.country),
    city,
    cityKey,
    leagueId: cleanNum(team.leagueId),
    season: cleanNum(team.season),
    stadiumKey: cleanStr(team.stadiumKey),
    founded: cleanNum(team.founded),
    clubColors: normalizeClubColors(team.clubColors),
    aliases: normalizeAliases(team.aliases),
  };
}

function mergeTeamSources(...sources: TeamMap[]): TeamMap {
  const merged: TeamMap = {};

  for (const source of sources) {
    for (const [rawKey, rawValue] of Object.entries(source)) {
      if (!isTeamRecord(rawValue)) continue;

      const normalized = normalizeTeam(rawKey, rawValue);
      if (!normalized.teamKey) continue;

      merged[normalized.teamKey] = normalized;
    }
  }

  return merged;
}

export const teams: TeamMap = mergeTeamSources(
  premierLeagueTeams,
  laLigaTeams,
  serieATeams,
  bundesligaTeams,
  ligue1Teams,
  primeiraLigaTeams,
  eredivisieTeams,
  scottishPremiershipTeams,
  superLigTeams,
  proLeagueTeams,
  superLeagueGreeceTeams,
  austrianBundesligaTeams,
  superligaDenmarkTeams,
  swissSuperLeagueTeams,
  czechFirstLeagueTeams,
  ekstraklasaTeams,
  allsvenskanTeams,
  eliteserienTeams,
  veikkausliigaTeams,
  bestaDeildTeams,
  nbITeams,
  superLigaTeams,
  hnlTeams,
  superLigaSerbiaTeams,
  superLigaSlovakiaTeams,
  prvaLigaSloveniaTeams,
  firstLeagueBulgariaTeams,
  firstDivisionCyprusTeams,
  premierLeagueBosniaTeams,
  leagueOfIrelandPremierTeams
);

export const POPULAR_TEAM_IDS = new Set<number>(
  POPULAR_TEAM_KEYS.map((k) => teams[k]?.teamId).filter(
    (n): n is number => typeof n === "number"
  )
);

export function getPopularTeams(): TeamRecord[] {
  return POPULAR_TEAM_KEYS.map((k) => teams[k]).filter(Boolean);
}

let _aliasToTeamKey: Map<string, string> | null = null;

function buildAliasMap(): Map<string, string> {
  const map = new Map<string, string>();

  Object.values(teams).forEach((team) => {
    const canonical = normalizeTeamKey(team.teamKey);
    if (canonical) map.set(canonical, team.teamKey);

    const nameKey = normalizeTeamKey(team.name);
    if (nameKey && !map.has(nameKey)) map.set(nameKey, team.teamKey);

    (team.aliases ?? []).forEach((alias) => {
      const aliasKey = normalizeTeamKey(alias);
      if (!aliasKey) return;
      if (!map.has(aliasKey)) map.set(aliasKey, team.teamKey);
    });
  });

  return map;
}

export function resolveTeamKey(input: string): string | null {
  const key = normalizeTeamKey(input);
  if (!key) return null;

  if (!_aliasToTeamKey) _aliasToTeamKey = buildAliasMap();
  return _aliasToTeamKey.get(key) ?? null;
}

export function getTeam(teamInput: string): TeamRecord | null {
  const resolved = resolveTeamKey(teamInput);
  const key = resolved ? normalizeTeamKey(resolved) : normalizeTeamKey(teamInput);
  return teams[key] ?? null;
}

export function hasTeam(teamInput: string): boolean {
  return !!getTeam(teamInput);
}

export function searchTeams(query: string, limit = 10): TeamRecord[] {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];

  return Object.values(teams)
    .map((team) => {
      const name = team.name.toLowerCase();
      const aliases = (team.aliases ?? []).map((a) => a.toLowerCase());
      const city = (team.city ?? "").toLowerCase();
      const country = (team.country ?? "").toLowerCase();

      let score = 0;

      if (name === q) score += 100;
      if (aliases.includes(q)) score += 95;

      if (name.startsWith(q)) score += 70;
      if (aliases.some((a) => a.startsWith(q))) score += 60;

      if (name.includes(q)) score += 35;
      if (aliases.some((a) => a.includes(q))) score += 25;

      if (city === q) score += 18;
      if (city.includes(q)) score += 10;

      if (country === q) score += 6;

      if (team.leagueId) score += 5;
      if (team.teamId) score += 2;

      return { team, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.team.name.localeCompare(b.team.name))
    .slice(0, Math.max(1, limit))
    .map((x) => x.team);
}

export function leagueForTeam(team: TeamRecord): LeagueOption | null {
  if (!team.leagueId) return null;

  const match = LEAGUES.find((league) => league.leagueId === team.leagueId);
  if (!match) return null;

  const season = typeof team.season === "number" ? team.season : match.season;
  return { ...match, season };
}

export function getTeamsByLeague(leagueId: number): TeamRecord[] {
  const id = cleanNum(leagueId);
  if (!id) return [];

  return Object.values(teams).filter((team) => team.leagueId === id);
}

export function getTeamsByCountry(country: string): TeamRecord[] {
  const value = String(country ?? "").trim().toLowerCase();
  if (!value) return [];

  return Object.values(teams).filter(
    (team) => String(team.country ?? "").trim().toLowerCase() === value
  );
}

export function getTeamsByCity(city: string): TeamRecord[] {
  const value = String(city ?? "").trim().toLowerCase();
  if (!value) return [];

  return Object.values(teams).filter(
    (team) => String(team.city ?? "").trim().toLowerCase() === value
  );
}

export function getTeamsByCityKey(cityKey: string): TeamRecord[] {
  const key = normalizeCityKey(cityKey);
  if (!key) return [];

  return Object.values(teams).filter(
    (team) => normalizeCityKey(team.cityKey ?? "") === key
  );
}

export function getTeamsDebugSnapshot() {
  const all = Object.values(teams);

  return {
    count: all.length,
    missingTeamId: all
      .filter((team) => team.teamId == null)
      .map((team) => ({
        teamKey: team.teamKey,
        name: team.name,
        country: team.country,
        city: team.city,
        cityKey: team.cityKey,
      })),
    missingLeagueId: all
      .filter((team) => team.leagueId == null)
      .map((team) => ({
        teamKey: team.teamKey,
        name: team.name,
        country: team.country,
        city: team.city,
        cityKey: team.cityKey,
      })),
    missingStadiumKey: all
      .filter((team) => !team.stadiumKey)
      .map((team) => ({
        teamKey: team.teamKey,
        name: team.name,
        country: team.country,
        city: team.city,
        cityKey: team.cityKey,
      })),
    missingCity: all
      .filter((team) => !team.city)
      .map((team) => ({
        teamKey: team.teamKey,
        name: team.name,
        country: team.country,
      })),
    missingCityKey: all
      .filter((team) => !team.cityKey)
      .map((team) => ({
        teamKey: team.teamKey,
        name: team.name,
        country: team.country,
        city: team.city,
      })),
    missingCountry: all
      .filter((team) => !team.country)
      .map((team) => ({
        teamKey: team.teamKey,
        name: team.name,
        city: team.city,
        cityKey: team.cityKey,
      })),
  };
}

export type { TeamRecord } from "./types";

export default teams;
