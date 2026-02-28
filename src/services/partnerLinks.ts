// src/services/partnerLinks.ts
// Small helpers for partner URLs needing logic beyond affiliateLinks.ts.
// Tickets: prefer exact Sportsevents365 event URL when available; fallback to resolver.

import { buildAffiliateUrl, resolveSe365EventForFixture, getSe365EventUrl } from "@/src/services/se365";

export type TicketLinkArgs = {
  fixtureId?: string | number;
  home: string;
  away: string;
  kickoffIso: string;
  leagueName?: string;
  leagueId?: number | string;

  // Optional enrichment already known:
  se365EventId?: number;
  se365EventUrl?: string | null;
};

function clean(s: any): string {
  return String(s ?? "").trim();
}

export async function buildTicketLink(args: TicketLinkArgs): Promise<string | null> {
  const home = clean(args.home);
  const away = clean(args.away);
  const kickoffIso = clean(args.kickoffIso);
  if (!home || !away || !kickoffIso) return null;

  const directUrl = clean(args.se365EventUrl);
  if (directUrl) return buildAffiliateUrl(directUrl);

  const fixtureId = args.fixtureId ?? `${home}__${away}__${kickoffIso}`;

  try {
    const { eventUrl } = await resolveSe365EventForFixture({
      fixtureId,
      homeName: home,
      awayName: away,
      kickoffIso,
      leagueName: args.leagueName,
      leagueId: args.leagueId,
    });

    if (!eventUrl) return null;
    return buildAffiliateUrl(eventUrl);
  } catch {
    try {
      const url = await getSe365EventUrl({
        fixtureId,
        homeName: home,
        awayName: away,
        kickoffIso,
        leagueName: args.leagueName,
        leagueId: args.leagueId,
      });
      return url || null;
    } catch {
      return null;
    }
  }
}
