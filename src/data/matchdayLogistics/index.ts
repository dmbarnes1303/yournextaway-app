// src/data/matchdayLogistics/index.ts
import type { MatchdayLogistics } from "./types";

import premierLeagueLogistics from "./premierLeague";
import laLigaLogistics from "./laLiga";
import serieALogistics from "./serieA";
import bundesligaLogistics from "./bundesliga";
import ligue1Logistics from "./ligue1";

import { normalizeClubKey } from "@/src/data/ticketGuides";

/**
 * Matchday Logistics registry
 * Supports:
 * - Premier League
 * - La Liga
 * - Serie A
 * - Bundesliga
 * - Ligue 1
 */

type LeagueKey =
  | "premier_league"
  | "la_liga"
  | "serie_a"
  | "bundesliga"
  | "ligue_1";

function nLeague(s?: string | null) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function detectLeagueKey(leagueName?: string | null): LeagueKey | null {
  const s = nLeague(leagueName);
  if (!s) return null;

  if (s.includes("premier league") || s === "epl") return "premier_league";
  if (s.includes("la liga") || s.includes("laliga") || s.includes("primera"))
    return "la_liga";
  if (s.includes("serie a") || s.includes("seriea")) return "serie_a";
  if (s.includes("bundesliga")) return "bundesliga";
  if (s.includes("ligue 1") || s.includes("ligue1")) return "ligue_1";

  return null;
}

function findInMap(
  map: Record<string, MatchdayLogistics>,
  teamNameRaw: string
): MatchdayLogistics | null {
  const key = normalizeClubKey(teamNameRaw);
  if (!key) return null;

  // exact
  if (map[key]) return map[key];

  // loose contains fallback
  for (const k of Object.keys(map)) {
    if (key === k) return map[k];
    if (key.includes(k) || k.includes(key)) return map[k];
  }

  return null;
}

const LEAGUE_MAPS: Record<LeagueKey, Record<string, MatchdayLogistics>> = {
  premier_league: premierLeagueLogistics,
  la_liga: laLigaLogistics,
  serie_a: serieALogistics,
  bundesliga: bundesligaLogistics,
  ligue_1: ligue1Logistics,
};

export function getMatchdayLogistics(args: {
  homeTeamName?: string | null;
  leagueName?: string | null;
}): MatchdayLogistics | null {
  const home = String(args.homeTeamName ?? "").trim();
  if (!home) return null;

  const leagueKey = detectLeagueKey(args.leagueName);

  // If league known → search only that league
  if (leagueKey) {
    return findInMap(LEAGUE_MAPS[leagueKey], home);
  }

  // Fallback: search all leagues (safe order)
  const order: LeagueKey[] = [
    "premier_league",
    "la_liga",
    "serie_a",
    "bundesliga",
    "ligue_1",
  ];

  for (const lk of order) {
    const found = findInMap(LEAGUE_MAPS[lk], home);
    if (found) return found;
  }

  return null;
}
