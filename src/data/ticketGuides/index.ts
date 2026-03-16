// src/data/ticketGuides/index.ts

import type { TicketGuide } from "./types";

import premierLeagueTicketGuides from "./premierLeague";
import laLigaTicketGuides from "./laLiga";
import serieATicketGuides from "./serieA";
import bundesligaTicketGuides from "./bundesliga";
import ligue1TicketGuides from "./ligue1";

import { normalizeClubKey } from "@/src/data/clubKey";

type TicketDifficulty = TicketGuide["difficulty"];

type LeagueTicketFallback = {
  leagueId: number;
  difficulty: TicketDifficulty;
  note: string;
};

const EUROPEAN_LEAGUE_TICKET_FALLBACKS: Record<number, LeagueTicketFallback> = {
  2: {
    leagueId: 2,
    difficulty: "hard",
    note: "European knock-out and marquee group-stage demand can spike sharply.",
  },
  3: {
    leagueId: 3,
    difficulty: "medium",
    note: "Europa League demand varies a lot by club and tie importance.",
  },
  848: {
    leagueId: 848,
    difficulty: "medium",
    note: "Conference League demand is usually more manageable than UCL but still tie-dependent.",
  },

  39: {
    leagueId: 39,
    difficulty: "hard",
    note: "Premier League tickets are usually among the hardest standard league tickets to access.",
  },
  140: {
    leagueId: 140,
    difficulty: "medium",
    note: "La Liga varies heavily by club, but top-end fixtures tighten quickly.",
  },
  135: {
    leagueId: 135,
    difficulty: "medium",
    note: "Serie A is mixed overall, with bigger clubs and derbies tightening demand fast.",
  },
  78: {
    leagueId: 78,
    difficulty: "medium",
    note: "Bundesliga is strong on demand, though some clubs remain more accessible than EPL level.",
  },
  61: {
    leagueId: 61,
    difficulty: "medium",
    note: "Ligue 1 is mixed, with PSG and bigger occasions pulling the average up.",
  },

  88: {
    leagueId: 88,
    difficulty: "medium",
    note: "Eredivisie is usually manageable outside major clubs and top rivalry fixtures.",
  },
  94: {
    leagueId: 94,
    difficulty: "medium",
    note: "Primeira Liga is moderate overall, but top-three demand rises quickly.",
  },
  203: {
    leagueId: 203,
    difficulty: "medium",
    note: "Super Lig demand can spike hard for the biggest clubs and derbies.",
  },

  179: {
    leagueId: 179,
    difficulty: "medium",
    note: "Scotland is generally manageable outside the biggest clubs and Old Firm level fixtures.",
  },
  144: {
    leagueId: 144,
    difficulty: "medium",
    note: "Belgium is usually moderate, with some stronger pressure at top clubs.",
  },
  218: {
    leagueId: 218,
    difficulty: "easy",
    note: "Austria is generally easier for standard league access than the major Western leagues.",
  },
  210: {
    leagueId: 210,
    difficulty: "easy",
    note: "Switzerland is generally more accessible for standard league fixtures.",
  },
  119: {
    leagueId: 119,
    difficulty: "easy",
    note: "Denmark is usually straightforward outside standout rivalries or title-shaping games.",
  },
  113: {
    leagueId: 113,
    difficulty: "easy",
    note: "Sweden is generally accessible for standard league fixtures.",
  },
  103: {
    leagueId: 103,
    difficulty: "easy",
    note: "Norway is generally accessible for standard league fixtures.",
  },
  197: {
    leagueId: 197,
    difficulty: "medium",
    note: "Greece is mixed, with major clubs and derbies often much tougher than the base level.",
  },
  106: {
    leagueId: 106,
    difficulty: "easy",
    note: "Poland is usually more accessible than the top Western leagues, with selective spikes.",
  },
  345: {
    leagueId: 345,
    difficulty: "easy",
    note: "Czech league access is typically manageable for standard fixtures.",
  },
  207: {
    leagueId: 207,
    difficulty: "easy",
    note: "Serbia is generally more accessible than the biggest European leagues.",
  },
  164: {
    leagueId: 164,
    difficulty: "easy",
    note: "Iceland is generally accessible, though capacity can make standout fixtures tighter.",
  },

  271: {
    leagueId: 271,
    difficulty: "easy",
    note: "Hungary is usually accessible outside bigger local spikes.",
  },
  283: {
    leagueId: 283,
    difficulty: "easy",
    note: "Romania is generally accessible for standard domestic fixtures.",
  },
  332: {
    leagueId: 332,
    difficulty: "easy",
    note: "Slovakia is generally accessible for standard domestic fixtures.",
  },
  373: {
    leagueId: 373,
    difficulty: "easy",
    note: "Slovenia is generally accessible for standard domestic fixtures.",
  },
  318: {
    leagueId: 318,
    difficulty: "easy",
    note: "Cyprus is usually accessible outside standout derby fixtures.",
  },
  172: {
    leagueId: 172,
    difficulty: "easy",
    note: "Bulgaria is generally accessible for standard domestic fixtures.",
  },
  315: {
    leagueId: 315,
    difficulty: "easy",
    note: "Bosnia is generally accessible for standard domestic fixtures.",
  },
};

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
 * Lookup a league fallback difficulty when a club-level guide does not exist yet.
 */
export function getLeagueTicketDifficultyFallback(
  leagueId: number | null | undefined
): TicketDifficulty | null {
  if (typeof leagueId !== "number" || !Number.isFinite(leagueId)) return null;
  return EUROPEAN_LEAGUE_TICKET_FALLBACKS[leagueId]?.difficulty ?? null;
}

/**
 * Optional helper for UI/explanations where you want the fallback note.
 */
export function getLeagueTicketFallbackNote(
  leagueId: number | null | undefined
): string | null {
  if (typeof leagueId !== "number" || !Number.isFinite(leagueId)) return null;
  return EUROPEAN_LEAGUE_TICKET_FALLBACKS[leagueId]?.note ?? null;
}

/**
 * Safe helper: returns a lightweight “ticket badge” value for fixture cards.
 * Club-level guides win. League-level fallback fills the rest.
 */
export function getTicketDifficultyBadge(
  clubInput: string,
  leagueId?: number | null
): TicketGuide["difficulty"] | null {
  const clubGuideDifficulty = getTicketGuide(clubInput)?.difficulty ?? null;
  if (clubGuideDifficulty) return clubGuideDifficulty;

  return getLeagueTicketDifficultyFallback(leagueId) ?? null;
}

export { normalizeClubKey };
