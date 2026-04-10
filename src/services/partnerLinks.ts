// src/services/partnerLinks.ts

import {
  AffiliateConfig,
  getCanonicalPartnerId,
  getPartnerOrNull,
  type PartnerId,
} from "@/src/constants/partners";
import { buildAffiliateLinks, type CabinClass } from "@/src/services/affiliateLinks";

type ResolveAffiliateContext = {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;
  passengers?: number | null;
  cabinClass?: CabinClass | null;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function enc(value: unknown): string {
  return encodeURIComponent(clean(value));
}

function safeUrl(value: unknown): string {
  const raw = clean(value);
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function getResolvedPartnerId(partnerId: string): PartnerId | "" {
  const rawId = clean(partnerId).toLowerCase();
  if (!rawId) return "";

  const partner = getPartnerOrNull(rawId);
  if (!partner) return "";

  return getCanonicalPartnerId(partner.id);
}

function extractSe365Aid(): string {
  const tracked = clean(AffiliateConfig.sportsevents365Tracked);
  if (!tracked) return "";

  try {
    const url = new URL(tracked);
    return clean(url.searchParams.get("a_aid"));
  } catch {
    const match = tracked.match(/[?&]a_aid=([^&]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  }
}

function appendSe365Aid(url: string): string {
  const safe = safeUrl(url);
  if (!safe) return "";

  try {
    const parsed = new URL(safe);

    if (clean(parsed.searchParams.get("a_aid"))) {
      return parsed.toString();
    }

    const aid = extractSe365Aid();
    if (!aid) return parsed.toString();

    parsed.searchParams.set("a_aid", aid);
    return parsed.toString();
  } catch {
    if (safe.includes("a_aid=")) return safe;

    const aid = extractSe365Aid();
    if (!aid) return safe;

    const joiner = safe.includes("?") ? "&" : "?";
    return `${safe}${joiner}a_aid=${enc(aid)}`;
  }
}

export function buildAffiliateUrl(baseUrl: string, partnerId: string): string {
  const url = safeUrl(baseUrl);
  const resolvedId = getResolvedPartnerId(partnerId);

  if (!url || !resolvedId) return "";

  switch (resolvedId) {
    case "sportsevents365":
      return appendSe365Aid(url);

    case "aviasales":
    case "expedia":
    case "safetywing":
    case "footballticketnet":
      return url;

    default:
      return "";
  }
}

/**
 * Important:
 * This does NOT verify that the URL is a clean exact-event route.
 * It only applies affiliate handling to a provided ticket URL.
 */
export function buildTicketLink(args: {
  eventUrl: string;
  partnerId?: string | null;
}): string | null {
  const inputUrl = clean(args.eventUrl);
  const partnerId = clean(args.partnerId) || "sportsevents365";

  if (!inputUrl) return null;

  const tracked = buildAffiliateUrl(inputUrl, partnerId);
  return tracked || null;
}

/**
 * Important:
 * For ticket partners this returns marketplace/search-style affiliate routes
 * generated from city/date context. It does NOT return resolver-verified
 * fixture-specific ticket URLs.
 */
export function resolveAffiliateUrl(
  partnerId: string,
  ctx: ResolveAffiliateContext
): string | null {
  const resolvedId = getResolvedPartnerId(partnerId);
  const city = clean(ctx.city);

  if (!resolvedId || !city) return null;

  const links = buildAffiliateLinks({
    city,
    startDate: ctx.startDate ?? null,
    endDate: ctx.endDate ?? null,
    originIata: ctx.originIata ?? null,
    passengers: ctx.passengers ?? null,
    cabinClass: ctx.cabinClass ?? null,
  });

  switch (resolvedId) {
    case "aviasales":
      return clean(links.flightsUrl) || null;

    case "expedia":
      return clean(links.hotelsUrl) || null;

    case "sportsevents365": {
      const marketplaceUrl = clean(links.ticketsPrimaryUrl);
      return marketplaceUrl ? buildAffiliateUrl(marketplaceUrl, "sportsevents365") : null;
    }

    case "footballticketnet": {
      const marketplaceUrl = clean(links.ticketsSecondaryUrl);
      return marketplaceUrl ? buildAffiliateUrl(marketplaceUrl, "footballticketnet") : null;
    }

    case "safetywing":
      return clean(links.insuranceUrl) || null;

    default:
      return null;
  }
}
