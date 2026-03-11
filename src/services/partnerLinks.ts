import { AffiliateConfig } from "@/src/constants/partners";
import { buildAffiliateLinks, type CabinClass } from "@/src/services/affiliateLinks";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function enc(v: unknown) {
  return encodeURIComponent(clean(v));
}

function safeUrl(value: string): string {
  const url = clean(value);
  if (!url) return "";

  try {
    return new URL(url).toString();
  } catch {
    return "";
  }
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

export function buildAffiliateUrl(baseUrl: string, partnerId: string) {
  const url = safeUrl(baseUrl);
  const id = clean(partnerId).toLowerCase();

  if (!url) return "";

  switch (id) {
    case "sportsevents365":
      return appendSe365Aid(url);

    default:
      return url;
  }
}

export function buildTicketLink(args: { eventUrl: string }) {
  const eventUrl = clean(args.eventUrl);
  if (!eventUrl) return null;

  const tracked = buildAffiliateUrl(eventUrl, "sportsevents365");
  return tracked || null;
}

export function resolveAffiliateUrl(
  partnerId: string,
  ctx: {
    city: string;
    startDate?: string | null;
    endDate?: string | null;
    originIata?: string | null;
    passengers?: number | null;
    cabinClass?: CabinClass | null;
  }
): string | null {
  const id = clean(partnerId).toLowerCase();
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
      return clean(links.flightsUrl) || null;

    case "expedia":
    case "expedia_stays":
      return clean(links.hotelsUrl) || null;

    case "kiwitaxi":
      return clean(links.transfersUrl) || null;

    case "getyourguide":
      return clean(links.experiencesUrl) || null;

    case "sportsevents365": {
      const direct = clean(AffiliateConfig.sportsevents365Tracked);
      if (direct) return direct;

      const fallback = clean(links.ticketsUrl);
      return fallback ? buildAffiliateUrl(fallback, "sportsevents365") : null;
    }

    default:
      return null;
  }
}
