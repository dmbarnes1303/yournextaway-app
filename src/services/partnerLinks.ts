// src/services/partnerLinks.ts
// Partner deep-link builders (tickets / flights / stays / etc.).
//
// Phase 1 goal for tickets:
// - Open the *exact* Sportsevents365 event page when possible.
// - Fall back to a safe search URL if we can't resolve an event.

import { ticketsUrl } from "@/src/services/affiliateLinks";
import {
  appendAffiliateId,
  normalizeEventUrl,
  se365FindEventInTournament,
  se365GetEvent,
} from "@/src/services/se365";

/**
 * Map API-Football leagueId -> SE365 tournamentId.
 *
 * You MUST fill these with the correct SE365 tournament IDs.
 * If a league isn't mapped, we can only fall back to search links.
 */
export const SE365_TOURNAMENT_BY_LEAGUE: Record<number, number> = {
  // Premier League (API-Football 39): TODO
  // 39: 0,

  // La Liga (API-Football 140): Eugene's example uses tournament/694
  // If that's La Liga in your account, keep it. Otherwise change it.
  140: 694,

  // Serie A (API-Football 135): TODO
  // 135: 0,

  // Bundesliga (API-Football 78): TODO
  // 78: 0,

  // Ligue 1 (API-Football 61): TODO
  // 61: 0,
};

export async function buildTicketLink(input: {
  home: string;
  away: string;
  dateIso: string; // YYYY-MM-DD
  leagueId?: number;
  /** If you already stored SE365 event ID, this is the most reliable path. */
  se365EventId?: number;
}): Promise<string | null> {
  const home = String(input.home ?? "").trim();
  const away = String(input.away ?? "").trim();
  const dateIso = String(input.dateIso ?? "").trim();

  if (!home || !away || !dateIso) return null;

  // 1) Best case: we already know the SE365 event id.
  if (Number.isFinite(Number(input.se365EventId)) && Number(input.se365EventId) > 0) {
    try {
      const ev = await se365GetEvent(Number(input.se365EventId));
      const url = normalizeEventUrl(ev?.eventUrl);
      if (url) return appendAffiliateId(url);
    } catch {
      // fall through to other strategies
    }
  }

  // 2) Next best: find the event by tournament listing + team/date match.
  const leagueId = Number(input.leagueId);
  const tournamentId = Number.isFinite(leagueId) ? SE365_TOURNAMENT_BY_LEAGUE[leagueId] : undefined;

  if (Number.isFinite(Number(tournamentId)) && Number(tournamentId) > 0) {
    try {
      const ev = await se365FindEventInTournament({
        tournamentId: Number(tournamentId),
        home,
        away,
        dateIso,
      });

      const url = normalizeEventUrl(ev?.eventUrl);
      if (url) return appendAffiliateId(url);
    } catch {
      // fall back
    }
  }

  // 3) Fallback: search link (still affiliate-tagged) so user can find it.
  // This is not ideal UX, but it's better than failing to open.
  try {
    return ticketsUrl(home, away, dateIso);
  } catch {
    return null;
  }
}
