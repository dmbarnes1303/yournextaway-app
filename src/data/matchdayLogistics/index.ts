// src/data/matchdayLogistics/index.ts

import type { MatchdayLogistics } from "./types";

import premierLeagueLogistics from "./premierLeague";
import laLigaLogistics from "./laLiga";
import serieALogistics from "./serieA";
import bundesligaLogistics from "./bundesliga";
import ligue1Logistics from "./ligue1";

import { normalizeClubKey } from "@/src/data/clubKey";

export const matchdayLogistics: Record<string, MatchdayLogistics> = {
  ...premierLeagueLogistics,
  ...laLigaLogistics,
  ...serieALogistics,
  ...bundesligaLogistics,
  ...ligue1Logistics,
};

export function getMatchdayLogistics(clubInput: string): MatchdayLogistics | null {
  const key = normalizeClubKey(clubInput);
  if (!key) return null;
  return matchdayLogistics[key] ?? null;
}

/**
 * Tiny UI helper: produce a compact one-line summary for cards.
 * This avoids every screen inventing its own formatting.
 */
export function buildLogisticsSnippet(l: MatchdayLogistics): string {
  const stops = Array.isArray(l.transport?.primaryStops) ? l.transport.primaryStops : [];
  const stopNames = stops.slice(0, 2).map((s) => s.name).filter(Boolean);

  const parking = l.parking?.availability;

  const bits: string[] = [];

  if (stopNames.length) bits.push(`Nearest: ${stopNames.join(" / ")}`);
  if (parking) bits.push(`Parking: ${parking}`);

  return bits.join(" • ");
}
