// src/data/matchdayLogistics/index.ts

/**
 * Matchday logistics registry + lookup.
 *
 * Important reality:
 * - Your detailed “stay areas / stops / tips” will always be incomplete unless you maintain it.
 * - That’s fine. The app should degrade gracefully.
 *
 * This module guarantees:
 * - If we find a club entry → return it (with identity fields injected)
 * - If we don’t → return a minimal object (still useful for UI + proximity via stadium coords)
 *
 * That means: no more “null logistics = dead UI”.
 */

import type { MatchdayLogistics, LogisticsStop } from "./types";

import premierLeagueLogistics from "./premierLeague";
import laLigaLogistics from "./laLiga";
import serieALogistics from "./serieA";
import bundesligaLogistics from "./bundesliga";
import ligue1Logistics from "./ligue1";

import { normalizeClubKey } from "@/src/data/clubKey";

/* -------------------------------------------------------------------------- */
/* league detection */
/* -------------------------------------------------------------------------- */

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

  if (s.includes("premier league") || s === "epl") return "premier_league";
  if (s.includes("la liga") || s.includes("laliga") || s.includes("primera")) return "la_liga";
  if (s.includes("serie a") || s.includes("seriea")) return "serie_a";
  if (s.includes("bundesliga")) return "bundesliga";
  if (s.includes("ligue 1") || s.includes("ligue1")) return "ligue_1";

  return null;
}

/* -------------------------------------------------------------------------- */
/* maps */
/* -------------------------------------------------------------------------- */

const LEAGUE_MAPS: Record<LeagueKey, Record<string, MatchdayLogistics>> = {
  premier_league: premierLeagueLogistics,
  la_liga: laLigaLogistics,
  serie_a: serieALogistics,
  bundesliga: bundesligaLogistics,
  ligue_1: ligue1Logistics,
};

/* -------------------------------------------------------------------------- */
/* lookup helpers */
/* -------------------------------------------------------------------------- */

function findInMap(map: Record<string, MatchdayLogistics>, teamNameRaw: string): MatchdayLogistics | null {
  const key = normalizeClubKey(teamNameRaw);
  if (!key) return null;

  // exact
  if (map[key]) return map[key];

  // loose fallback (dangerous but practical for alias drift)
  const keys = Object.keys(map);
  for (const k of keys) {
    if (key === k) return map[k];
    if (key.includes(k) || k.includes(key)) return map[k];
  }

  return null;
}

function withIdentity(
  found: MatchdayLogistics,
  args: { homeTeamName: string; leagueName?: string | null }
): MatchdayLogistics {
  // Never mutate source maps
  const home = String(args.homeTeamName ?? "").trim();
  const league = String(args.leagueName ?? "").trim();

  return {
    ...found,
    homeTeamName: found.homeTeamName || home,
    clubName: found.clubName || home,
    league: found.league || league || undefined,
  };
}

function minimalLogistics(args: { homeTeamName: string; leagueName?: string | null }): MatchdayLogistics {
  const home = String(args.homeTeamName ?? "").trim();
  const league = String(args.leagueName ?? "").trim();

  return {
    homeTeamName: home || undefined,
    clubName: home || undefined,
    league: league || undefined,
    // Stadium/city unknown at this layer; UI can still use clubName for coords matching.
    stadium: undefined,
    city: undefined,
    stay: undefined,
    transport: undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* public API */
/* -------------------------------------------------------------------------- */

/**
 * Get logistics guidance for a home club.
 *
 * Never returns null unless the caller gave no homeTeamName.
 * If we can’t find the club in any registry, we return a minimal object.
 */
export function getMatchdayLogistics(args: {
  homeTeamName?: string | null;
  leagueName?: string | null;
}): MatchdayLogistics | null {
  const home = String(args.homeTeamName ?? "").trim();
  if (!home) return null;

  const leagueKey = detectLeagueKey(args.leagueName);

  // 1) If league known → search only that league first
  if (leagueKey) {
    const hit = findInMap(LEAGUE_MAPS[leagueKey], home);
    if (hit) return withIdentity(hit, { homeTeamName: home, leagueName: args.leagueName });
    // fall through to all-league scan if league mis-detected or map incomplete
  }

  // 2) Fallback: scan all leagues (stable order)
  const order: LeagueKey[] = ["premier_league", "la_liga", "serie_a", "bundesliga", "ligue_1"];
  for (const lk of order) {
    const hit = findInMap(LEAGUE_MAPS[lk], home);
    if (hit) return withIdentity(hit, { homeTeamName: home, leagueName: args.leagueName });
  }

  // 3) Nothing found: return minimal object so UI still works (coords/tips can still show “unknown” safely)
  return minimalLogistics({ homeTeamName: home, leagueName: args.leagueName });
}

/**
 * Small, UI-friendly snippet for list rows (Trip screen).
 * Conservative + stable: no fake venue names, no “best pub” claims.
 */
export function buildLogisticsSnippet(logistics: MatchdayLogistics): string {
  const stops = Array.isArray(logistics.transport?.primaryStops) ? logistics.transport!.primaryStops! : [];
  const pick = stops
    .slice(0, 2)
    .map((s) => String(s?.name ?? "").trim())
    .filter(Boolean);

  const city = String(logistics.city ?? "").trim();
  const stadium = String(logistics.stadium ?? "").trim();

  const a = pick[0] ? `Best stops: ${pick[0]}` : "";
  const b = pick[1] ? `, ${pick[1]}` : "";
  const c = stadium ? ` • ${stadium}` : city ? ` • ${city}` : "";

  const line = `${a}${b}${c}`.trim();
  return line || "Matchday logistics available";
}

/**
 * Optional helper: return first N primary stops.
 */
export function firstStops(logistics: MatchdayLogistics, n = 3): LogisticsStop[] {
  const stops = Array.isArray(logistics.transport?.primaryStops) ? logistics.transport!.primaryStops! : [];
  const count = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  return stops.slice(0, count);
}
