// src/services/partnerLinks.ts
// High-level partner link resolvers used by screens.
// Must never crash; always return null or a safe URL.

import { AffiliateConfig } from "@/src/constants/partners";
import { buildAffiliateLinks, type CabinClass } from "@/src/services/affiliateLinks";

function clean(v: any): string {
  return String(v ?? "").trim();
}

function enc(v: any) {
  return encodeURIComponent(String(v ?? "").trim());
}

/**
 * SportsEvents365: attach your a_aid to any SportsEvents365 URL.
 * (They also accept a_aid at root; we keep your exact provided base elsewhere too.)
 */
export function buildAffiliateUrl(baseUrl: string, partnerId: string) {
  const url = clean(baseUrl);
  if (!url) return "";

  // If it's already got your a_aid, don't double-append.
  if (partnerId === "sportsevents365" && url.includes("a_aid=")) return url;

  if (partnerId === "sportsevents365") {
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}a_aid=${enc(AffiliateConfig.sportsevents365Tracked?.split("a_aid=")[1] ?? "")}`;
  }
  return url;
}

/**
 * Ticket link builder.
 * If you have event-specific URLs already, we just ensure tracking param exists.
 * If not, callers should pass the best known SportsEvents365 event URL.
 */
export function buildTicketLink(args: { eventUrl: string }) {
  const base = clean(args.eventUrl);
  if (!base) return null;
  return buildAffiliateUrl(base, "sportsevents365");
}

/**
 * Resolve a partner URL for a trip context.
 * This is what Trip Workspace should use for the “Smart booking” buttons.
 */
export function resolveAffiliateUrl(
  partnerId: string,
  ctx: {
    city: string;
    startDate?: string | null;
    endDate?: string | null;
    originIata?: string | null;

    // optional enhancements
    passengers?: number | null;
    cabinClass?: CabinClass | null;
  }
): string | null {
  const id = clean(partnerId);
  const city = clean(ctx.city);
  if (!id || !city) return null;

  const links = buildAffiliateLinks({
    city,
    startDate: ctx.startDate ?? null,
    endDate: ctx.endDate ?? null,
    originIata: ctx.originIata ?? null,
    passengers: ctx.passengers ?? null,
    cabinClass: ctx.cabinClass ?? null,
  });

  switch (id) {
    case "aviasales":
      return links.flightsUrl;

    case "expedia":
    case "expedia_stays":
      return links.hotelsUrl;

    case "kiwitaxi":
      return links.transfersUrl;

    case "getyourguide":
      return links.experiencesUrl;

    case "sportsevents365":
      // Generic fallback (event-specific link should use buildTicketLink).
      return AffiliateConfig.sportsevents365Tracked || links.ticketsUrl;

    default:
      return null;
  }
}
