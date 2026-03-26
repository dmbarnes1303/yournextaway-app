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

  const matchStart = addDays(kickoffDate ?? null, -1);
  const matchEnd = addDays(kickoffDate ?? null, 1);

  return {
    startDate: matchStart || tripStart,
    endDate: matchEnd || tripEnd,
  };
}

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

  return {
    ticketsUrl: built.ticketsUrl || "",
    flightsUrl: built.flightsUrl || "",
    staysUrl: built.staysUrl || "",
    trainsUrl: built.trainsUrl || "",
    busesUrl: built.busesUrl || "",
    transfersUrl: built.transfersUrl || "",
    insuranceUrl: built.insuranceUrl || "",
    thingsUrl: built.thingsUrl || "",
    carHireUrl: built.carHireUrl || "",
    mapsUrl: built.mapsUrl || buildMapsSearchUrl(`${clean(cityName)} travel`),
    officialSiteUrl: built.officialSiteUrl || "",
    claimsUrl: built.claimsUrl || "",

    // compatibility
    hotelsUrl: built.hotelsUrl || built.staysUrl || "",
    experiencesUrl: built.experiencesUrl || built.thingsUrl || "",
    transportUrl: built.transportUrl || built.trainsUrl || "",
    omioUrl: built.omioUrl || built.trainsUrl || "",
  };
}

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

    return {
      amount: cheapest.price,
      currency: cheapest.currency,
      text: `${cheapest.currency} ${cheapest.price}`,
      source: "metadata",
    };
  } catch {
    return null;
  }
}
