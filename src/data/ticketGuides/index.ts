// src/data/ticketGuides/index.ts

import type { TicketGuide } from "./types";

import premierLeagueTicketGuides from "./premierLeague";
import laLigaTicketGuides from "./laLiga";
import serieATicketGuides from "./serieA";
import bundesligaTicketGuides from "./bundesliga";
import ligue1TicketGuides from "./ligue1";

import { normalizeClubKey } from "@/src/data/clubKey";

/**
 * Registry (single lookup point)
 * IMPORTANT: canonical-only files rely on normalizeClubKey to map API variants to these keys.
 */
export const ticketGuides: Record<string, TicketGuide> = {
  ...premierLeagueTicketGuides,
  ...laLigaTicketGuides,
  ...serieATicketGuides,
  ...bundesligaTicketGuides,
  ...ligue1TicketGuides,
};

/**
 * Lookup by any string you have (team name from API, user input, etc).
 */
export function getTicketGuide(clubInput: string): TicketGuide | null {
  const key = normalizeClubKey(clubInput);
  if (!key) return null;
  return ticketGuides[key] ?? null;
}

/**
 * Safe helper: returns a lightweight “ticket badge” value for fixture cards.
 */
export function getTicketDifficultyBadge(clubInput: string): TicketGuide["difficulty"] | null {
  return getTicketGuide(clubInput)?.difficulty ?? null;
}

export { normalizeClubKey };
