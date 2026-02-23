// src/data/matchdayLogistics/index.ts
import type { MatchdayLogistics } from "./types";

import premierLeagueLogistics from "./premierLeague";
import laLigaLogistics from "./laLiga";
import serieALogistics from "./serieA";
import bundesligaLogistics from "./bundesliga";
import ligue1Logistics from "./ligue1";

import { normalizeClubKey } from "@/src/data/ticketGuides";

/**
 * Matchday Logistics registry.
 * Supports: Premier League, La Liga, Serie A, Bundesliga, Ligue 1
 *
 * Notes:
 * - We normalize club keys using the same normalizeClubKey() used by ticket guides.
 * - We do a conservative fallback match so "PSG" can still match "paris saint-germain" etc.
 * - If leagueName is missing/unknown, we try all leagues in a safe priority order.
 */

type LeagueKey = "premier_league" | "la_liga" | "serie_a" | "bundesliga" | "ligue_1";

function nLeague(s?: string | null) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function detectLeagueKey(leagueName?: string | null): LeagueKey | null {
  const s = nLeague(leagueName);
  if (!s) return null;

  // Premier League
  if (s.includes("premier league") || s === "epl" || s.includes("english premier")) return "premier_league";

  // La Liga (naming varies a lot)
  if (s.includes("la liga") || s.includes("laliga") || s.includes("primera division") || s.includes("primera división"))
    return "la_liga";

  // Serie A
  if (s.includes("serie a") || s.includes("seriea") || s.includes("italy serie a") || s.includes("italian serie a"))
    return "serie_a";

  // Bundesliga
  if (s.includes("bundesliga") || s.includes("1. bundesliga") || s.includes("german bundesliga"))
    return "bundesliga";

  // Ligue 1
  if (s.includes("ligue 1") || s.includes("ligue1") || s.includes("french ligue 1")) return "ligue_1";

  return null;
}

function findInMap(map: Record<string, MatchdayLogistics>, teamNameRaw: string): MatchdayLogistics | null {
  const key = normalizeClubKey(teamNameRaw);
  if (!key) return null;

  // 1) exact
  if (map[key]) return map[key];

  // 2) contains fallback (handles "psg" vs "paris saint-germain", "inter" vs "inter milan", etc.)
  const keys = Object.keys(map);
  for (const k of keys) {
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

  // If league is known, search that league only (fast + less wrong).
  if (leagueKey) {
    return findInMap(LEAGUE_MAPS[leagueKey], home);
  }

  // If league is missing/unknown, try all leagues (safe fallback).
  // Priority puts most-likely first for your current app set.
  const order: LeagueKey[] = ["premier_league", "la_liga", "serie_a", "bundesliga", "ligue_1"];
  for (const lk of order) {
    const found = findInMap(LEAGUE_MAPS[lk], home);
    if (found) return found;
  }

  return null;
}
