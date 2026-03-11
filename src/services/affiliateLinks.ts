// src/services/affiliateLinks.ts
// Central affiliate link builders.
// Contract: MUST NEVER crash UI. Always return safe URLs.

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

export type CabinClass = "economy" | "premium" | "business" | "first";

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function enc(v: unknown) {
  return encodeURIComponent(clean(v));
}

function ymdOrNull(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  try {
    return formatIsoToYmd(s);
  } catch {
    return null;
  }
}

function yyyymmdd(date: string | null): string | null {
  if (!date) return null;
  return date.replace(/-/g, "");
}

function slugCity(city: string) {
  return clean(city)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function clampInt(v: unknown, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return Math.max(min, Math.min(max, i));
}

function appendQuery(
  base: string,
  params: Record<string, string | null | undefined>
) {
  const safeBase = clean(base);
  if (!safeBase) return "";

  const entries = Object.entries(params).filter(([, v]) => clean(v));
  if (!entries.length) return safeBase;

  const joiner = safeBase.includes("?") ? "&" : "?";
  const qs = entries.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&");
  return `${safeBase}${joiner}${qs}`;
}

function googleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${enc(query)}`;
}

function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${enc(query)}`;
}

function buildAviasalesUrl(args: {
  city: string;
  originIata: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
  cabinClass: CabinClass;
}) {
  const marker = clean(AffiliateConfig.aviasalesMarker);
  const trackedFallback = clean(AffiliateConfig.aviasalesFallback);

  const cityName = clean(args.city);
  const origin = clean(args.originIata) || "LON";
  const destination = cityName ? getIataCityCodeForCity(cityName) : null;
  const outbound = yyyymmdd(args.startDate);
  const inbound = yyyymmdd(args.endDate);

  if (marker && destination && outbound) {
    const routeToken = `${origin}${destination}${outbound}1`;
    const base = `https://www.aviasales.com/search/${routeToken}?marker=${enc(marker)}`;

    return appendQuery(base, {
      return_date: inbound,
      adults: args.passengers > 1 ? String(args.passengers) : null,
      cabin: args.cabinClass !== "economy" ? args.cabinClass : null,
    });
  }

  if (trackedFallback) {
    return trackedFallback;
  }

  return googleSearchUrl(`${cityName} flights`);
}

function buildExpediaUrl(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
}) {
  const cityName = clean(args.city);
  const token = clean(AffiliateConfig.expediaToken);

  if (!cityName) {
    return googleSearchUrl("hotels");
  }

  if (!token) {
    return googleSearchUrl(`${cityName} hotels`);
  }

  const slug = slugCity(cityName);
  const base = `https://expedia.com/affiliates/hotel-search-${slug}.${token}`;

  return appendQuery(base, {
    startDate: args.startDate,
    endDate: args.endDate,
    adults: String(args.passengers),
  });
}

function buildKiwitaxiUrl(city: string) {
  const tracked = clean(AffiliateConfig.kiwitaxiTracked);
  if (tracked) return tracked;
  return googleSearchUrl(`${clean(city)} airport transfer`);
}

function buildTicketsUrl(city: string) {
  const tracked = clean(AffiliateConfig.sportsevents365Tracked);
  if (tracked) return tracked;
  return googleSearchUrl(`${clean(city)} football tickets`);
}

function buildGetYourGuideUrl(city: string) {
  const cityName = clean(city);
  const partnerId = clean(AffiliateConfig.getyourguidePartnerId);

  if (partnerId && cityName) {
    return `https://www.getyourguide.com/s/?q=${enc(cityName)}&partner_id=${enc(partnerId)}`;
  }

  return googleSearchUrl(`${cityName} things to do`);
}

/**
 * Builds partner links with best-effort prefill + tracking.
 * Must never throw.
 */
export function buildAffiliateLinks(args: {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;
  passengers?: number | null;
  cabinClass?: CabinClass | null;
}) {
  const cityName = clean(args.city);
  const startDate = ymdOrNull(args.startDate);
  const endDate = ymdOrNull(args.endDate);

  const originIata = clean(args.originIata) || "LON";
  const passengers = clampInt(args.passengers, 1, 9, 1);
  const cabinClass = (clean(args.cabinClass) as CabinClass) || "economy";

  const flightsUrl = buildAviasalesUrl({
    city: cityName,
    originIata,
    startDate,
    endDate,
    passengers,
    cabinClass,
  });

  const hotelsUrl = buildExpediaUrl({
    city: cityName,
    startDate,
    endDate,
    passengers,
  });

  const transfersUrl = buildKiwitaxiUrl(cityName);
  const ticketsUrl = buildTicketsUrl(cityName);
  const experiencesUrl = buildGetYourGuideUrl(cityName);
  const mapsUrl = googleMapsSearchUrl(cityName);

  return {
    flightsUrl,
    hotelsUrl,
    transfersUrl,
    ticketsUrl,
    experiencesUrl,
    mapsUrl,
  };
}
