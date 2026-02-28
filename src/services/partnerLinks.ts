// src/services/partnerLinks.ts
// Small, focused helpers for building partner URLs that need logic beyond pure affiliateLinks.
//
// RULES:
// - Keep this file low-dependency (services-only).
// - Never crash: return null on failure.
// - Tickets: prefer exact Sportsevents365 event URL when available; fallback to resolver.
//
// NOTE: Do NOT append arbitrary query params to tracked links from affiliateLinks.ts.
// Tickets are special: SE365 event URLs can accept affiliate params, and our resolver handles them.

import { getSe365EventUrl, buildAffiliateUrl, resolveSe365EventForFixture } from "@/src/services/se365";

export type TicketLinkArgs = {
  fixtureId?: string | number;
  home: string;
  away: string;
  kickoffIso: string; // full ISO from API-Football (preferred)
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

  // If we already have the event URL, just affiliate-wrap it.
  const directUrl = clean(args.se365EventUrl);
  if (directUrl) return buildAffiliateUrl(directUrl);

  // If we only have an eventId, we can't reliably build a public web URL without knowing SE365 format.
  // So we still resolve to get the web URL (proxy/direct).
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
    // Last-chance helper (same logic, but wrapped)
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
