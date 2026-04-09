// src/services/affiliateLinks.ts

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

export type CabinClass = "economy" | "premium" | "business" | "first";

export type BuildAffiliateLinksArgs = {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;
  passengers?: number | null;
  cabinClass?: CabinClass | null;
};

export type BuiltAffiliateLinks = {
  flightsUrl: string | null;
  hotelsUrl: string | null;
  ticketsPrimaryUrl: string | null;
  ticketsSecondaryUrl: string | null;
  insuranceUrl: string | null;
  ticketsUrl: string | null;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function enc(value: unknown): string {
  return encodeURIComponent(clean(value));
}

function normalizeYmd(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  try {
    return formatIsoToYmd(raw);
  } catch {
    return null;
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function normalizeCabinClass(value: unknown): CabinClass {
  const raw = clean(value).toLowerCase();

  if (raw === "premium") return "premium";
  if (raw === "business") return "business";
  if (raw === "first") return "first";
  return "economy";
}

function safeUrl(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (!/^https?:$/i.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function appendQuery(
  base: string,
  params: Record<string, string | null | undefined>
): string {
  const safeBase = clean(base);
  if (!safeBase) return "";

  const entries = Object.entries(params).filter(([, value]) => clean(value));
  if (!entries.length) return safeBase;

  const joiner = safeBase.includes("?") ? "&" : "?";
  const queryString = entries
    .map(([key, value]) => `${enc(key)}=${enc(value)}`)
    .join("&");

  return `${safeBase}${joiner}${queryString}`;
}

function resolveTrackedOrFallbackUrl(
  trackedValue: unknown,
  fallbackValue: unknown = null
): string | null {
  return safeUrl(trackedValue) || safeUrl(fallbackValue);
}

function normalizeOriginIata(value: unknown): string {
  const raw = clean(value).toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : "LON";
}

function resolveDestinationIata(city: string): string | null {
  const resolved = clean(getIataCityCodeForCity(city)).toUpperCase();
  return /^[A-Z]{3}$/.test(resolved) ? resolved : null;
}

function mapCabinClassToTripClass(value: CabinClass): string {
  switch (value) {
    case "business":
    case "first":
      return "1";
    case "premium":
    case "economy":
    default:
      return "0";
  }
}

function buildFlightsUrl(args: {
  city: string;
  originIata: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
  cabinClass: CabinClass;
}): string | null {
  const city = clean(args.city);
  const origin = normalizeOriginIata(args.originIata);
  const destination = resolveDestinationIata(city);
  const departDate = args.startDate;
  const returnDate = args.endDate;
  const marker = clean(AffiliateConfig.aviasalesMarker);

  const fallback =
    resolveTrackedOrFallbackUrl(AffiliateConfig.aviasalesFallback) ||
    resolveTrackedOrFallbackUrl("https://www.aviasales.com/");

  if (!destination || !departDate) {
    return fallback;
  }

  return appendQuery("https://search.aviasales.com/flights", {
    origin_iata: origin,
    destination_iata: destination,
    depart_date: departDate,
    return_date: returnDate,
    adults: String(Math.max(1, args.passengers)),
    children: "0",
    infants: "0",
    trip_class: mapCabinClassToTripClass(args.cabinClass),
    one_way: returnDate ? "false" : "true",
    marker: marker || null,
    locale: "en",
    currency: "gbp",
  });
}

function buildHotelsUrl(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
  passengers: number;
}): string | null {
  const city = clean(args.city);
  if (!city) return null;

  const base =
    resolveTrackedOrFallbackUrl(AffiliateConfig.expediaTracked) ||
    resolveTrackedOrFallbackUrl("https://www.expedia.co.uk/Hotel-Search");

  if (!base) return null;

  return appendQuery(base, {
    destination: city,
    startDate: args.startDate,
    endDate: args.endDate,
    adults: String(Math.max(1, args.passengers)),
    rooms: "1",
  });
}

function buildSportsEvents365Url(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
}): string | null {
  const base = resolveTrackedOrFallbackUrl(AffiliateConfig.sportsevents365Tracked);
  if (!base) return null;

  const city = clean(args.city);

  return appendQuery(base, {
    q: city || null,
    city: city || null,
    from: args.startDate,
    to: args.endDate,
  });
}

function buildFootballTicketNetUrl(args: {
  city: string;
  startDate: string | null;
  endDate: string | null;
}): string | null {
  const base =
    resolveTrackedOrFallbackUrl(AffiliateConfig.footballticketnetTracked) ||
    resolveTrackedOrFallbackUrl("https://www.footballticketnet.com/");

  if (!base) return null;

  const city = clean(args.city);

  return appendQuery(base, {
    q: city || null,
    city: city || null,
    from: args.startDate,
    to: args.endDate,
  });
}

function buildInsuranceUrl(): string | null {
  return (
    resolveTrackedOrFallbackUrl(AffiliateConfig.safetywingAffiliateUrl) ||
    resolveTrackedOrFallbackUrl("https://safetywing.com/")
  );
}

export function buildAffiliateLinks(args: BuildAffiliateLinksArgs): BuiltAffiliateLinks {
  const city = clean(args.city);
  const startDate = normalizeYmd(args.startDate);
  const endDate = normalizeYmd(args.endDate);
  const originIata = normalizeOriginIata(args.originIata);
  const passengers = clampInt(args.passengers, 1, 9, 1);
  const cabinClass = normalizeCabinClass(args.cabinClass);

  const ticketsPrimaryUrl = buildSportsEvents365Url({
    city,
    startDate,
    endDate,
  });

  const ticketsSecondaryUrl = buildFootballTicketNetUrl({
    city,
    startDate,
    endDate,
  });

  return {
    flightsUrl: buildFlightsUrl({
      city,
      originIata,
      startDate,
      endDate,
      passengers,
      cabinClass,
    }),
    hotelsUrl: buildHotelsUrl({
      city,
      startDate,
      endDate,
      passengers,
    }),
    ticketsPrimaryUrl,
    ticketsSecondaryUrl,
    insuranceUrl: buildInsuranceUrl(),
    ticketsUrl: ticketsPrimaryUrl,
  };
}
