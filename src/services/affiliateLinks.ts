// src/services/affiliateLinks.ts
import type { TripLinkItem } from "@/src/state/trips";
import Constants from "expo-constants";

/**
 * Centralised affiliate link builder.
 *
 * IMPORTANT:
 * - Keep ALL partner IDs here (single source of truth).
 * - UI/screens should only call buildAffiliateLinks().
 *
 * Notes:
 * - GetYourGuide search URLs should use:
 *   https://www.getyourguide.com/s/?q=<query>&partner_id=<id>
 *   (NOT /s/<query>) 1
 */

export type AffiliateLinkKind = "hotels" | "flights" | "trains" | "experiences" | "maps";

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

type AffiliateConfig = {
  bookingAffiliateId?: string; // Booking.com: aid=
  skyscannerAffilId?: string; // Skyscanner: associateid=
  omioPartnerId?: string; // Omio: partner_id=
  getYourGuidePartnerId?: string; // GetYourGuide: partner_id=
  viatorAid?: string; // reserved
};

function env(name: string): string | undefined {
  const extra = (Constants?.expoConfig as any)?.extra ?? (Constants as any)?.manifest?.extra ?? {};
  const v =
    (extra && typeof extra[name] === "string" ? String(extra[name]) : undefined) ??
    (typeof process !== "undefined" && (process as any)?.env && typeof (process as any).env[name] === "string"
      ? String((process as any).env[name])
      : undefined);
  const s = String(v ?? "").trim();
  return s || undefined;
}

/**
 * Put your IDs in app.json -> expo.extra and/or .env as EXPO_PUBLIC_*.
 * Example:
 * EXPO_PUBLIC_GYG_PARTNER_ID=XXXXXXX
 */
const AFFILIATE: AffiliateConfig = {
  bookingAffiliateId: env("EXPO_PUBLIC_BOOKING_AID"),
  skyscannerAffilId: env("EXPO_PUBLIC_SKYSCANNER_ASSOCIATE_ID"),
  omioPartnerId: env("EXPO_PUBLIC_OMIO_PARTNER_ID"),
  getYourGuidePartnerId: env("EXPO_PUBLIC_GYG_PARTNER_ID"),
};

function enc(v: string): string {
  return encodeURIComponent(v);
}

function cleanCity(input: string): string {
  return String(input ?? "").trim();
}

function cleanCountry(input?: string): string | undefined {
  const s = String(input ?? "").trim();
  return s || undefined;
}

function safeQueryCity(city: string, country?: string) {
  const c = cleanCity(city);
  const co = cleanCountry(country);
  return co ? `${c}, ${co}` : c;
}

function isIsoDateOnly(s?: string): boolean {
  if (!s) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim());
}

export function buildAffiliateLinks(args: {
  city: string;
  country?: string;
  startDate?: string;
  endDate?: string;
}): AffiliateLinks {
  const city = cleanCity(args.city);
  const country = cleanCountry(args.country);
  const startDate = isIsoDateOnly(args.startDate) ? String(args.startDate).trim() : undefined;
  const endDate = isIsoDateOnly(args.endDate) ? String(args.endDate).trim() : undefined;

  const query = safeQueryCity(city, country);

  // --------------------
  // Hotels: Booking.com search
  // --------------------
  const bookingBase = "https://www.booking.com/searchresults.html";
  const bookingParams: string[] = [`ss=${enc(query)}`];

  if (startDate) bookingParams.push(`checkin=${enc(startDate)}`);
  if (endDate) bookingParams.push(`checkout=${enc(endDate)}`);

  if (AFFILIATE.bookingAffiliateId) bookingParams.push(`aid=${enc(AFFILIATE.bookingAffiliateId)}`);

  const hotelsUrl = `${bookingBase}?${bookingParams.join("&")}`;

  // --------------------
  // Flights: Skyscanner entry
  // --------------------
  const flightsBase = "https://www.skyscanner.net/transport/flights/";
  const flightsUrl = AFFILIATE.skyscannerAffilId
    ? `${flightsBase}?associateid=${enc(AFFILIATE.skyscannerAffilId)}`
    : flightsBase;

  // --------------------
  // Trains: Omio
  // --------------------
  const omioBase = "https://www.omio.com/";
  const trainsUrl = AFFILIATE.omioPartnerId
    ? `${omioBase}?partner_id=${enc(AFFILIATE.omioPartnerId)}&utm_source=yna&utm_medium=app&utm_campaign=trains`
    : `${omioBase}?utm_source=yna&utm_medium=app&utm_campaign=trains`;

  // --------------------
  // Experiences: GetYourGuide SEARCH (correct format)
  // https://www.getyourguide.com/s/?q=<query>&partner_id=<id> 2
  // --------------------
  const gygBase = "https://www.getyourguide.com/s/";
  const gygParams: string[] = [`q=${enc(query)}`];
  if (AFFILIATE.getYourGuidePartnerId) gygParams.push(`partner_id=${enc(AFFILIATE.getYourGuidePartnerId)}`);
  const experiencesUrl = `${gygBase}?${gygParams.join("&")}`;

  // --------------------
  // Maps: Google Maps search
  // --------------------
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(query)}`;

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

export function buildAffiliateLinkItems(
  links: AffiliateLinks
): Array<Pick<TripLinkItem, "title" | "url" | "group">> {
  return [
    { title: "Hotels (search)", url: links.hotelsUrl, group: "stay" },
    { title: "Flights (search)", url: links.flightsUrl, group: "travel" },
    { title: "Trains / coaches (search)", url: links.trainsUrl, group: "travel" },
    { title: "GetYourGuide (things to do)", url: links.experiencesUrl, group: "links" },
    { title: "Maps (search)", url: links.mapsUrl, group: "links" },
  ];
}

export function normalizeUrlForCompare(url: string): string {
  return String(url ?? "").trim().toLowerCase();
}
