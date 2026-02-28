// src/services/partnerLinks.ts

import {
  fetchTournamentEvents,
  findMatchingEvent,
  buildAffiliateUrl,
} from "@/src/services/se365";

/**
 * Resolve SE365 ticket link for a fixture
 */
export async function buildTicketLink(params: {
  leagueId?: number;
  home: string;
  away: string;
  dateIso: string;
}): Promise<string | null> {
  const { leagueId, home, away, dateIso } = params;

  if (!leagueId || !home || !away || !dateIso) return null;

  const events = await fetchTournamentEvents(leagueId);
  if (!events.length) return null;

  const match = findMatchingEvent(events, home, away, dateIso);
  if (!match?.eventUrl) return null;

  return buildAffiliateUrl(match.eventUrl);
}
