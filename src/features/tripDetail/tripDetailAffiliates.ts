// src/features/tripDetail/tripDetailAffiliates.ts

import type { AffiliateUrls } from "@/src/features/tripDetail/helpers";
import {
  buildMapsSearchUrl,
  clean,
  cleanUpper3,
  getIsoDateOnly,
} from "@/src/features/tripDetail/helpers";

import { buildAffiliateLinks } from "@/src/services/affiliateLinks";
import { searchFlights } from "@/src/services/flights";
import { getIataCityCodeForCity } from "@/src/constants/iataCities";

import type { Trip } from "@/src/state/trips";

export type PricePoint = {
  amount: number | null;
  currency: string | null;
  text: string | null;
  source: "saved_item" | "metadata" | "price_text" | null;
};

export type FlightSearchState = {
  loading: boolean;
  pricePoint: PricePoint | null;
};

/* ----------------------------- utils ----------------------------- */

function addDays(ymd: string | null, offset: number): string | null {
  const raw = clean(ymd);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;

  const d = new Date(`${raw}T12:00:00Z`);
  if (!Number.isFinite(d.getTime())) return null;

  d.setUTCDate(d.getUTCDate() + offset);

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

// CRITICAL FIX → return null, not ""
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

/* ----------------------------- booking window ----------------------------- */

export function getBookingWindow(args: {
  trip: Trip | null;
  primaryKickoffIso: string | null;
}): {
  startDate: string | null;
  endDate: string | null;
} {
  const kickoffDate = getIsoDateOnly(args.primaryKickoffIso);
  const tripStart = clean(args.trip?.startDate) || null;
  const tripEnd = clean(args.trip?.endDate) || null;

  const defaultStart = addDays(kickoffDate ?? null, -1);
  const defaultEnd = addDays(kickoffDate ?? null, 1);

  return {
    startDate: tripStart || defaultStart,
    endDate: tripEnd || defaultEnd,
  };
}

/* ----------------------------- affiliate urls ----------------------------- */

export function buildAffiliateUrls(args: {
  trip: Trip | null;
  cityName: string;
  originIata: string;
  primaryKickoffIso: string | null;
}): AffiliateUrls | null {
  const { trip, cityName, originIata, primaryKickoffIso } = args;

  if (!trip || !clean(cityName) || cityName === "Trip") return null;

  const bookingWindow = getBookingWindow({
    trip,
    primaryKickoffIso,
  });

  const built = buildAffiliateLinks({
    city: clean(cityName),
    startDate: bookingWindow.startDate,
    endDate: bookingWindow.endDate,
    originIata: cleanUpper3(originIata, "LON"),
    passengers: 1,
    cabinClass: "economy",
  });

  const ticketsUrl = safeUrl(built.ticketsUrl);
  const flightsUrl = safeUrl(built.flightsUrl);
  const hotelsUrl = safeUrl(built.hotelsUrl);
  const transfersUrl = safeUrl(built.transfersUrl);
  const insuranceUrl = safeUrl(built.insuranceUrl);
  const experiencesUrl = safeUrl(built.experiencesUrl);

  const transportUrl =
    safeUrl(built.transportUrl) ||
    safeUrl(built.omioUrl);

  const omioUrl =
    safeUrl(built.omioUrl) ||
    safeUrl(built.transportUrl);

  const mapsUrl =
    safeUrl(built.mapsUrl) ||
    safeUrl(buildMapsSearchUrl(`${clean(cityName)} travel`));

  const claimsUrl = safeUrl(built.claimsUrl);

  return {
    ticketsUrl,
    flightsUrl,
    staysUrl: hotelsUrl,
    trainsUrl: transportUrl,
    busesUrl: transportUrl,
    transfersUrl,
    insuranceUrl,
    thingsUrl: experiencesUrl,
    carHireUrl: null,
    mapsUrl,
    officialSiteUrl: null,
    claimsUrl,

    // compatibility
    hotelsUrl,
    experiencesUrl,
    transportUrl,
    omioUrl,
  };
}

/* ----------------------------- flights ----------------------------- */

export function resolveFlightDestinationIata(cityName: string): string {
  return clean(getIataCityCodeForCity(cityName)).toUpperCase();
}

export async function fetchLiveFlightPrice(args: {
  trip: Trip | null;
  cityName: string;
  originIata: string;
  primaryKickoffIso: string | null;
}): Promise<PricePoint | null> {
  const { trip, cityName, originIata, primaryKickoffIso } = args;

  if (!trip || !clean(cityName) || cityName === "Trip") return null;

  const origin = cleanUpper3(originIata, "LON");
  const destination = resolveFlightDestinationIata(cityName);

  if (!destination || origin === destination) return null;

  const bookingWindow = getBookingWindow({
    trip,
    primaryKickoffIso,
  });

  const departureDate = bookingWindow.startDate;
  const returnDate = bookingWindow.endDate;

  if (!departureDate) return null;

  try {
    const result = await searchFlights({
      originIata: origin,
      destinationIata: destination,
      departureDate,
      returnDate,
      limit: 1,
    });

    if (!result.ok || !result.cheapest) return null;

    const cheapest = result.cheapest;

    const amount = Number(cheapest.price);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const currency = clean(cheapest.currency).toUpperCase() || null;

    return {
      amount,
      currency,
      text: currency
        ? `${currency} ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`
        : `${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`,
      source: "metadata",
    };
  } catch {
    return null;
  }
}
