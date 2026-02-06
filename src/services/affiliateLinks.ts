// src/services/affiliateLinks.ts
import Constants from "expo-constants";

/**
 * Centralised affiliate URL builder.
 *
 * IMPORTANT:
 * - This file ONLY builds URLs.
 * - It does NOT define partner identity.
 * - Partner IDs live in src/core/partners.ts
 */

export type AffiliateLinks = {
  city: string;
  country?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD

  hotelsUrl: string;
  flightsUrl: string;
  trainsUrl: string;
  experiencesUrl: string;
  mapsUrl: string;
};

/* -------------------------------------------------------------------------- */
/* env helpers */
/* -------------------------------------------------------------------------- */

function env(name: string): string | undefined {
  const extra =
    (Constants?.expoConfig as any)?.extra ??
    (Constants as any)?.manifest?.extra ??
    {};

  const v =
    (extra && typeof extra[name] === "string" ? String(extra[name]) : undefined) ??
    (typeof process !== "undefined" &&
    (process as any)?.env &&
    typeof (process as any).env[name] === "string"
      ? String((process as any).env[name])
      : undefined);

  const s = String(v ?? "").trim();
  return s || undefined;
}

const AFFILIATE = {
  bookingAid: env("EXPO_PUBLIC_BOOKING_AID"),
  skyscannerAssociateId: env("EXPO_PUBLIC_SKYSCANNER_ASSOCIATE_ID"),
  omioPartnerId: env("EXPO_PUBLIC_OMIO_PARTNER_ID"),
  getYourGuidePartnerId: env("EXPO_PUBLIC_GYG_PARTNER_ID"),
};

/* -------------------------------------------------------------------------- */

function enc(v: string) {
  return encodeURIComponent(v);
}

function cleanCity(input: string) {
  return String(input ?? "").trim();
}

function cleanCountry(input?: string) {
  const s = String(input ?? "").trim();
  return s || undefined;
}

function safeQuery(city: string, country?: string) {
  return country ? `${city}, ${country}` : city;
}

function isIsoDateOnly(s?: string) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(String(s));
}

/* -------------------------------------------------------------------------- */
/* public */
/* -------------------------------------------------------------------------- */

export function buildAffiliateLinks(args: {
  city: string;
  country?: string;
  startDate?: string;
  endDate?: string;
}): AffiliateLinks {
  const city = cleanCity(args.city);
  const country = cleanCountry(args.country);

  const startDate = isIsoDateOnly(args.startDate)
    ? String(args.startDate)
    : undefined;

  const endDate = isIsoDateOnly(args.endDate)
    ? String(args.endDate)
    : undefined;

  const query = safeQuery(city, country);

  /* -------------------- */
  /* Hotels (Booking.com) */
  /* -------------------- */

  const bookingParams: string[] = [`ss=${enc(query)}`];

  if (startDate) bookingParams.push(`checkin=${enc(startDate)}`);
  if (endDate) bookingParams.push(`checkout=${enc(endDate)}`);
  if (AFFILIATE.bookingAid) bookingParams.push(`aid=${enc(AFFILIATE.bookingAid)}`);

  const hotelsUrl =
    "https://www.booking.com/searchresults.html?" +
    bookingParams.join("&");

  /* -------------------- */
  /* Flights (Skyscanner) */
  /* -------------------- */

  const flightsParams: string[] = [];

  if (AFFILIATE.skyscannerAssociateId) {
    flightsParams.push(
      `associateid=${enc(AFFILIATE.skyscannerAssociateId)}`
    );
  }

  // Let Skyscanner handle location inference from query
  flightsParams.push(`destination=${enc(query)}`);

  const flightsUrl =
    "https://www.skyscanner.net/?" +
    flightsParams.join("&");

  /* -------------------- */
  /* Trains (Omio) */
  /* -------------------- */

  const trainsParams: string[] = [];

  if (AFFILIATE.omioPartnerId) {
    trainsParams.push(`partner_id=${enc(AFFILIATE.omioPartnerId)}`);
  }

  trainsParams.push("utm_source=yna");
  trainsParams.push("utm_medium=app");
  trainsParams.push("utm_campaign=trains");

  const trainsUrl =
    "https://www.omio.com/?" +
    trainsParams.join("&");

  /* -------------------- */
  /* Experiences (GetYourGuide search) */
  /* -------------------- */

  const gygParams: string[] = [`q=${enc(query)}`];

  if (AFFILIATE.getYourGuidePartnerId) {
    gygParams.push(
      `partner_id=${enc(AFFILIATE.getYourGuidePartnerId)}`
    );
  }

  const experiencesUrl =
    "https://www.getyourguide.com/s/?" +
    gygParams.join("&");

  /* -------------------- */
  /* Maps (Google Maps) */
  /* -------------------- */

  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=" +
    enc(query);

  return {
    city,
    country,
    startDate,
    endDate,
    hotelsUrl,
    flightsUrl,
    trainsUrl,
    experiencesUrl,
    mapsUrl,
  };
}

/**
 * Simple helper for comparisons / dedupe.
 */
export function normalizeUrlForCompare(url: string): string {
  return String(url ?? "").trim().toLowerCase();
}
