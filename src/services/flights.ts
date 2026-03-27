// src/services/flights.ts

import { getBackendBaseUrl } from "@/src/config/env";

export type FlightOffer = {
  id: string;
  price: number;
  currency: string;

  origin: string;
  destination: string;

  departureTime: string;
  arrivalTime: string;

  returnDepartureTime?: string | null;
  returnArrivalTime?: string | null;

  airline: string;
  flightNumber?: string | null;

  deepLink: string;
  provider: "aviasales";

  durationMinutes?: number | null;
  stops?: number;
};

export type FlightSearchResult = {
  ok: boolean;
  offers: FlightOffer[];
  cheapest: FlightOffer | null;

  cached: boolean;
  fromCacheAgeMs: number | null;

  error?: string;
};

type BackendFlightOffer = {
  origin?: string;
  destination?: string;
  departureAt?: string | null;
  returnAt?: string | null;
  airline?: string | null;
  flightNumber?: string | null;
  transfers?: number | null;
  returnTransfers?: number | null;
  duration?: number | null;
  durationTo?: number | null;
  durationBack?: number | null;
  price?: number | null;
  currency?: string | null;
  link?: string | null;
  expiresAt?: string | null;
  searchAt?: string | null;
  gate?: string | null;
  foundVia?: "prices_for_dates";
};

type BackendFlightSearchResult = {
  ok?: boolean;
  offers?: BackendFlightOffer[];
  cheapest?: BackendFlightOffer | null;
  cached?: boolean;
  fromCacheAgeMs?: number | null;
  error?: string;
};

/* ---------------- helpers ---------------- */

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function upper(value: unknown): string {
  return clean(value).toUpperCase();
}

function safeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
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

function safeIso(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return null;

  return d.toISOString();
}

function addMinutes(iso: string | null, minutes: number | null): string | null {
  if (!iso) return null;
  if (minutes == null || !Number.isFinite(minutes)) return null;

  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;

  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function buildOfferId(input: {
  origin: string;
  destination: string;
  departureTime: string | null;
  returnDepartureTime: string | null;
  airline: string;
  flightNumber: string | null;
  price: number;
}): string {
  return [
    input.origin,
    input.destination,
    input.departureTime ?? "",
    input.returnDepartureTime ?? "",
    input.airline,
    input.flightNumber ?? "",
    String(input.price),
  ].join("|");
}

function buildUrl(params: {
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate?: string | null;
  currency?: string;
  oneWay?: boolean;
  direct?: boolean;
  limit?: number;
  page?: number;
  market?: string;
}): string | null {
  const base = clean(getBackendBaseUrl());
  if (!base) return null;

  const originIata = upper(params.originIata);
  const destinationIata = upper(params.destinationIata);
  const departureDate = clean(params.departureDate);

  if (!originIata || !destinationIata || !departureDate) return null;

  const qs = new URLSearchParams({
    originIata,
    destinationIata,
    departureDate,
  });

  if (params.returnDate) qs.set("returnDate", clean(params.returnDate));
  if (params.currency) qs.set("currency", upper(params.currency));
  if (params.oneWay) qs.set("oneWay", "1");
  if (params.direct) qs.set("direct", "1");
  if (params.limit) qs.set("limit", String(safePositiveInt(params.limit, 10)));
  if (params.page) qs.set("page", String(safePositiveInt(params.page, 1)));
  if (params.market) qs.set("market", clean(params.market));

  return `${base}/flights/search?${qs.toString()}`;
}

function normalizeOffer(input: BackendFlightOffer | null | undefined): FlightOffer | null {
  if (!input) return null;

  const origin = upper(input.origin);
  const destination = upper(input.destination);
  const price = safeNumber(input.price);
  const currency = upper(input.currency) || "GBP";
  const airline = clean(input.airline) || "Unknown airline";
  const flightNumber = clean(input.flightNumber) || null;
  const deepLink = safeUrl(input.link);

  const departureTime = safeIso(input.departureAt);
  const returnDepartureTime = safeIso(input.returnAt);

  const durationTo = safeNumber(input.durationTo);
  const durationBack = safeNumber(input.durationBack);
  const duration = safeNumber(input.duration);

  const arrivalTime =
    addMinutes(departureTime, durationTo ?? duration) ?? departureTime;
  const returnArrivalTime =
    addMinutes(returnDepartureTime, durationBack) ?? returnDepartureTime;

  const stopsRaw = safeNumber(input.transfers);
  const stops = stopsRaw == null ? undefined : Math.max(0, Math.floor(stopsRaw));

  const durationMinutes =
    duration != null
      ? Math.max(0, Math.floor(duration))
      : durationTo != null
        ? Math.max(0, Math.floor(durationTo))
        : null;

  if (!origin || !destination || price == null || price <= 0 || !departureTime || !deepLink) {
    return null;
  }

  return {
    id: buildOfferId({
      origin,
      destination,
      departureTime,
      returnDepartureTime,
      airline,
      flightNumber,
      price,
    }),
    price,
    currency,
    origin,
    destination,
    departureTime,
    arrivalTime: arrivalTime ?? departureTime,
    returnDepartureTime,
    returnArrivalTime,
    airline,
    flightNumber,
    deepLink,
    provider: "aviasales",
    durationMinutes,
    stops,
  };
}

function sortOffers(a: FlightOffer, b: FlightOffer): number {
  if (a.price !== b.price) return a.price - b.price;

  const aStops = typeof a.stops === "number" ? a.stops : Number.POSITIVE_INFINITY;
  const bStops = typeof b.stops === "number" ? b.stops : Number.POSITIVE_INFINITY;
  if (aStops !== bStops) return aStops - bStops;

  return a.departureTime.localeCompare(b.departureTime);
}

function dedupeOffers(offers: FlightOffer[]): FlightOffer[] {
  const seen = new Map<string, FlightOffer>();

  for (const offer of offers) {
    const key = [
      offer.origin,
      offer.destination,
      offer.departureTime,
      offer.returnDepartureTime ?? "",
      offer.airline,
      offer.flightNumber ?? "",
      String(offer.price),
    ].join("|");

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, offer);
      continue;
    }

    const existingStops =
      typeof existing.stops === "number" ? existing.stops : Number.POSITIVE_INFINITY;
    const nextStops =
      typeof offer.stops === "number" ? offer.stops : Number.POSITIVE_INFINITY;

    if (nextStops < existingStops) {
      seen.set(key, offer);
    }
  }

  return Array.from(seen.values()).sort(sortOffers);
}

function normalizeSearchResult(parsed: BackendFlightSearchResult | null): FlightSearchResult {
  if (!parsed) {
    return {
      ok: false,
      offers: [],
      cheapest: null,
      cached: false,
      fromCacheAgeMs: null,
      error: "empty_response",
    };
  }

  const offers = dedupeOffers(
    Array.isArray(parsed.offers)
      ? parsed.offers
          .map((offer) => normalizeOffer(offer))
          .filter((offer): offer is FlightOffer => offer !== null)
      : []
  );

  const cheapest =
    normalizeOffer(parsed.cheapest) ??
    offers[0] ??
    null;

  const hasUsableData = offers.length > 0 || cheapest !== null;

  return {
    ok: hasUsableData ? true : Boolean(parsed.ok),
    offers,
    cheapest,
    cached: Boolean(parsed.cached),
    fromCacheAgeMs:
      typeof parsed.fromCacheAgeMs === "number" && Number.isFinite(parsed.fromCacheAgeMs)
        ? parsed.fromCacheAgeMs
        : null,
    error: clean(parsed.error) || undefined,
  };
}

/* ---------------- main function ---------------- */

export async function searchFlights(params: {
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate?: string | null;
  currency?: string;
  oneWay?: boolean;
  direct?: boolean;
  limit?: number;
  page?: number;
  market?: string;
}): Promise<FlightSearchResult> {
  const url = buildUrl(params);

  if (!url) {
    return {
      ok: false,
      offers: [],
      cheapest: null,
      cached: false,
      fromCacheAgeMs: null,
      error: "missing_backend_url",
    };
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    const raw = await res.text();
    let parsed: BackendFlightSearchResult | null = null;

    try {
      parsed = JSON.parse(raw) as BackendFlightSearchResult;
    } catch {
      return {
        ok: false,
        offers: [],
        cheapest: null,
        cached: false,
        fromCacheAgeMs: null,
        error: "invalid_json",
      };
    }

    const normalized = normalizeSearchResult(parsed);

    if (!res.ok) {
      return {
        ...normalized,
        ok: normalized.offers.length > 0 || normalized.cheapest !== null,
        error: normalized.error || `http_${res.status}`,
      };
    }

    return normalized;
  } catch {
    return {
      ok: false,
      offers: [],
      cheapest: null,
      cached: false,
      fromCacheAgeMs: null,
      error: "network_error",
    };
  }
}

export async function getCheapestFlight(params: {
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate?: string | null;
  currency?: string;
  oneWay?: boolean;
  direct?: boolean;
  market?: string;
}): Promise<FlightOffer | null> {
  const result = await searchFlights({
    ...params,
    limit: 10,
    page: 1,
  });

  return result.ok ? result.cheapest : null;
}
