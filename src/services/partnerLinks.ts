import { AffiliateConfig } from "@/src/constants/partners";
import { buildAffiliateLinks, type CabinClass } from "@/src/services/affiliateLinks";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function enc(v: unknown) {
  return encodeURIComponent(clean(v));
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

export function buildAffiliateUrl(baseUrl: string, partnerId: string) {
  const url = clean(baseUrl);
  if (!url) return "";

  if (partnerId === "sportsevents365") {
    if (url.includes("a_aid=")) return url;

    const aid = extractSe365Aid();
    if (!aid) return url;

    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}a_aid=${enc(aid)}`;
  }

  return url;
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
      return clean(AffiliateConfig.sportsevents365Tracked) || links.ticketsUrl;

    default:
      return null;
  }
}
