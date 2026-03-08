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

/**
 * V1 Team Registry (single source of truth)
 *
 * Why this exists:
 * - Home search must be able to find teams even when fixtures API results don't include them yet.
 * - Team guides will be keyed by a stable `teamKey`.
 *
 * Notes:
 * - Keep this registry accurate and deterministic.
 * - Avoid turning this file into a raw-data landfill.
 * - League-specific data belongs in league-specific files.
 */

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

export const teams: Record<string, TeamRecord> = {
  ...premierLeagueTeams,
  ...laLigaTeams,
  ...serieATeams,
  ...bundesligaTeams,
  ...ligue1Teams,
  ...primeiraLigaTeams,
  ...eredivisieTeams,
  ...scottishPremiershipTeams,
  ...superLigTeams,
  ...proLeagueTeams,
  ...superLeagueGreeceTeams,
  ...austrianBundesligaTeams,
  ...superligaDenmarkTeams,
  ...swissSuperLeagueTeams,
  ...czechFirstLeagueTeams,
  ...ekstraklasaTeams,
  ...allsvenskanTeams,
  ...eliteserienTeams,
  ...veikkausliigaTeams,
  ...bestaDeildTeams,
  ...nbITeams,
  ...superLigaTeams,
};

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

export function searchTeams(query: string, limit = 10): TeamRecord[] {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];

  return Object.values(teams)
    .map((team) => {
      const name = team.name.toLowerCase();
      const aliases = (team.aliases ?? []).map((a) => a.toLowerCase());

      let score = 0;

      if (name === q) score += 100;
      if (aliases.includes(q)) score += 95;

      if (name.startsWith(q)) score += 70;
      if (aliases.some((a) => a.startsWith(q))) score += 60;

      if (name.includes(q)) score += 35;
      if (aliases.some((a) => a.includes(q))) score += 25;

      if (team.leagueId) score += 5;

      return { team, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
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

export default teams;
