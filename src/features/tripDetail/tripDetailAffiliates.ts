import type { AffiliateUrls } from "@/src/features/tripDetail/helpers";
import {
  buildMapsSearchUrl,
  clean,
  cleanUpper3,
  getIsoDateOnly,
} from "@/src/features/tripDetail/helpers";

import { buildAffiliateLinks } from "@/src/services/affiliateLinks";
import { getIataCityCodeForCity } from "@/src/constants/iataCities";

import type { Trip } from "@/src/state/trips";

export type PricePoint = {
  amount: number | null;
  currency: string | null;
  text: string | null;
  source: "live_api" | null;
};

export type FlightSearchState = {
  loading: boolean;
  pricePoint: PricePoint | null;
};

function addDays(ymd: string | null, offset: number): string | null {
  const raw = clean(ymd);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;

  const date = new Date(`${raw}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return null;

  date.setUTCDate(date.getUTCDate() + offset);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function safeCityName(cityName: unknown): string {
  return clean(cityName);
}

function hasUsableTrip(trip: Trip | null): trip is Trip {
  return Boolean(trip && clean(trip.id));
}

export function getBookingWindow(args: {
  trip: Trip | null;
  primaryKickoffIso: string | null;
}): {
  startDate: string | null;
  endDate: string | null;
} {
  const kickoffDate = getIsoDateOnly(args.primaryKickoffIso);
  const explicitStart = clean(args.trip?.startDate) || null;
  const explicitEnd = clean(args.trip?.endDate) || null;

  const fallbackStart = addDays(kickoffDate ?? null, -1);
  const fallbackEnd = addDays(kickoffDate ?? null, 1);

  return {
    startDate: explicitStart || fallbackStart,
    endDate: explicitEnd || fallbackEnd,
  };
}

export function buildAffiliateUrls(args: {
  trip: Trip | null;
  cityName: string;
  originIata: string;
  primaryKickoffIso: string | null;
}): AffiliateUrls | null {
  const { trip, cityName, originIata, primaryKickoffIso } = args;

  const safeCity = safeCityName(cityName);
  if (!hasUsableTrip(trip) || !safeCity || safeCity === "Trip") {
    return null;
  }

  const { startDate, endDate } = getBookingWindow({
    trip,
    primaryKickoffIso,
  });

  const built = buildAffiliateLinks({
    city: safeCity,
    startDate,
    endDate,
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
  const claimsUrl = safeUrl(built.claimsUrl);

  const transportUrl =
    safeUrl(built.transportUrl) ||
    safeUrl(built.omioUrl);

  const omioUrl =
    safeUrl(built.omioUrl) ||
    safeUrl(built.transportUrl);

  const mapsUrl =
    safeUrl(built.mapsUrl) ||
    safeUrl(buildMapsSearchUrl(`${safeCity} travel`));

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

    // compatibility fields retained while surrounding trip-detail code
    // still references the older names
    hotelsUrl,
    experiencesUrl,
    transportUrl,
    omioUrl,
  };
}

export function resolveFlightDestinationIata(cityName: string): string {
  return clean(getIataCityCodeForCity(cityName)).toUpperCase();
}

/**
 * Locked product decision:
 * Trip Detail must not surface live non-booked flight pricing right now.
 *
 * This stays as a compatibility stub so existing imports do not break.
 */
export async function fetchLiveFlightPrice(_args: {
  trip: Trip | null;
  cityName: string;
  originIata: string;
  primaryKickoffIso: string | null;
}): Promise<PricePoint | null> {
  return null;
}
