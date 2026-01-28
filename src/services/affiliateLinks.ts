// src/services/affiliateLinks.ts

import type { TripLinkItem } from "@/src/state/trips";

/**
 * Centralised link builder.
 * V1: plain deep links (no affiliate tags yet).
 * V2: add affiliate params in ONE place (config below).
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
  bookingAffiliateId?: string;
  skyscannerAffilId?: string;
  omioPartnerId?: string;
  getYourGuidePartnerId?: string;
  viatorAid?: string;
};

// Later: fill these once you sign up.
// Keep them here so you never sprinkle IDs across UI/screens.
const AFFILIATE: AffiliateConfig = {};

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

export function buildAffiliateLinks(args: {
  city: string;
  country?: string;
  startDate?: string;
  endDate?: string;
}): AffiliateLinks {
  const city = cleanCity(args.city);
  const country = cleanCountry(args.country);
  const startDate = args.startDate ? String(args.startDate).trim() : undefined;
  const endDate = args.endDate ? String(args.endDate).trim() : undefined;

  const query = safeQueryCity(city, country);

  // --------------------
  // Hotels: Booking.com search
  // --------------------
  const bookingBase = "https://www.booking.com/searchresults.html";
  const bookingParams: string[] = [`ss=${enc(query)}`];

  if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) bookingParams.push(`checkin=${enc(startDate)}`);
  if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) bookingParams.push(`checkout=${enc(endDate)}`);

  if (AFFILIATE.bookingAffiliateId) {
    bookingParams.push(`aid=${enc(AFFILIATE.bookingAffiliateId)}`);
  }

  const hotelsUrl = `${bookingBase}?${bookingParams.join("&")}`;

  // --------------------
  // Flights: Skyscanner (generic entry)
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
  // Experiences: GetYourGuide search
  // --------------------
  const gygBase = "https://www.getyourguide.com/s/";
  const experiencesUrl = AFFILIATE.getYourGuidePartnerId
    ? `${gygBase}${enc(query)}?partner_id=${enc(AFFILIATE.getYourGuidePartnerId)}`
    : `${gygBase}${enc(query)}`;

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
    { title: "Experiences (things to do)", url: links.experiencesUrl, group: "links" },
    { title: "Maps (search)", url: links.mapsUrl, group: "links" },
  ];
}

export function normalizeUrlForCompare(url: string): string {
  return String(url ?? "").trim().toLowerCase();
}
