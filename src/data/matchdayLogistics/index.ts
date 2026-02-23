// src/data/matchdayLogistics/index.ts
import type { MatchdayLogistics } from "./types";

import premierLeagueLogistics from "./premierLeague";
import { normalizeClubKey } from "@/src/data/ticketGuides";

/**
 * Matchday Logistics registry.
 * Phase 1: seeded EPL set.
 * Later: add La Liga / Serie A / Bundesliga / Ligue 1 modules here.
 */

function isPremierLeague(leagueName?: string | null) {
  const s = String(leagueName ?? "").toLowerCase();
  return s.includes("premier league");
}

export function getMatchdayLogistics(args: {
  homeTeamName?: string | null;
  leagueName?: string | null;
}): MatchdayLogistics | null {
  const home = String(args.homeTeamName ?? "").trim();
  if (!home) return null;

  // Only EPL seeded right now
  if (!isPremierLeague(args.leagueName)) return null;

  const key = normalizeClubKey(home);
  if (!key) return null;

  return premierLeagueLogistics[key] ?? null;
}
