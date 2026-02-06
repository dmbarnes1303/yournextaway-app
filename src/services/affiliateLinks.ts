// src/services/affiliateLinks.ts
import Constants from "expo-constants";

/**
 * Centralised affiliate URL builder.
 *
 * IMPORTANT:
 * - This file ONLY builds URLs.
 * - It does NOT define partner identity.
 * - Partner IDs live in src/core/partners.ts
 *
 * Output shape:
 * - Keep legacy keys stable so existing screens don't break.
 * - Add new keys as Phase-1 spine expands (transfers/insurance/claims/tickets).
 */

export type AffiliateLinks = {
  city: string;
  country?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD

  // Legacy (already used by screens)
  hotelsUrl: string; // Expedia
  flightsUrl: string; // Aviasales
  trainsUrl: string; // fallback (no trains affiliate yet)
  experiencesUrl: string; // GetYourGuide
  mapsUrl: string; // Google Maps (untracked)

  // Phase-1 approved additions
  transfersUrl: string; // KiwiTaxi
  insuranceUrl: string; // SafetyWing
  claimsUrl: string; // AirHelp
  ticketsUrl: string; // SportsEvents365
};

/* -------------------------------------------------------------------------- */
/* env helpers */
/* -------------------------------------------------------------------------- */

function env(name: string): string | undefined {
  const extra = (Constants?.expoConfig as any)?.extra ?? (Constants as any)?.manifest?.extra ?? {};
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

/**
 * Suggested keys (keep consistent once live):
 * - EXPO_PUBLIC_AVIASALES_MARKER
 * - EXPO_PUBLIC_GYG_PARTNER_ID
 * - EXPO_PUBLIC_EXPEDIA_AFFIL_ID         (optional; program-specific)
 * - EXPO_PUBLIC_KIWITAXI_AFFIL_ID        (optional)
 * - EXPO_PUBLIC_SAFETYWING_AFFIL_ID      (optional)
 * - EXPO_PUBLIC_AIRHELP_AFFIL_ID         (optional)
 * - EXPO_PUBLIC_SPORTSEVENTS365_AFFIL_ID (optional)
 */
const AFFILIATE = {
  aviasalesMarker: env("EXPO_PUBLIC_AVIASALES_MARKER"),
  gygPartnerId: env("EXPO_PUBLIC_GYG_PARTNER_ID"),
  expediaAffilId: env("EXPO_PUBLIC_EXPEDIA_AFFIL_ID"),

  kiwitaxiAffilId: env("EXPO_PUBLIC_KIWITAXI_AFFIL_ID"),
  safetywingAffilId: env("EXPO_PUBLIC_SAFETYWING_AFFIL_ID"),
  airhelpAffilId: env("EXPO_PUBLIC_AIRHELP_AFFIL_ID"),
  sportsevents365AffilId: env("EXPO_PUBLIC_SPORTSEVENTS365_AFFIL_ID"),
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

function safeQueryCity(city: string, country?: string) {
  const c = cleanCity(city);
  const co = cleanCountry(country);
  return co ? `${c}, ${co}` : c;
}

function isIsoDateOnly(s?: string) {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim());
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

  const startDate = isIsoDateOnly(args.startDate) ? String(args.startDate).trim() : undefined;
  const endDate = isIsoDateOnly(args.endDate) ? String(args.endDate).trim() : undefined;

  const query = safeQueryCity(city, country);

  /* -------------------- */
  /* Hotels: Expedia */
  /* -------------------- */
  // Stable public search entry (affiliate deep links vary by program).
  const expediaParams: string[] = [`destination=${enc(query)}`];
  if (startDate) expediaParams.push(`startDate=${enc(startDate)}`);
  if (endDate) expediaParams.push(`endDate=${enc(endDate)}`);

  // Generic optional tag (harmless if ignored by Expedia).
  if (AFFILIATE.expediaAffilId) expediaParams.push(`affcid=${enc(AFFILIATE.expediaAffilId)}`);

  const hotelsUrl = `https://www.expedia.co.uk/Hotel-Search?${expediaParams.join("&")}`;

  /* -------------------- */
  /* Flights: Aviasales */
  /* -------------------- */
  const aviaParams: string[] = [];
  if (AFFILIATE.aviasalesMarker) aviaParams.push(`marker=${enc(AFFILIATE.aviasalesMarker)}`);

  // Best-effort hint; Aviasales may ignore, but URL still valid.
  aviaParams.push(`destination=${enc(query)}`);

  const flightsUrl = `https://www.aviasales.com/?${aviaParams.join("&")}`;

  /* -------------------- */
  /* Trains/Buses: fallback (UNTRACKED until affiliate) */
  /* -------------------- */
  const trainsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(`${query} train station`)}`;

  /* -------------------- */
  /* Experiences: GetYourGuide */
  /* -------------------- */
  // Correct search format: https://www.getyourguide.com/s/?q=<query>&partner_id=<id>
  const gygParams: string[] = [`q=${enc(query)}`];
  if (AFFILIATE.gygPartnerId) gygParams.push(`partner_id=${enc(AFFILIATE.gygPartnerId)}`);
  const experiencesUrl = `https://www.getyourguide.com/s/?${gygParams.join("&")}`;

  /* -------------------- */
  /* Transfers: KiwiTaxi */
  /* -------------------- */
  // Stable entry: we pass city as query. Affiliate programs vary; keep optional tag.
  const kiwiParams: string[] = [`query=${enc(query)}`];
  if (AFFILIATE.kiwitaxiAffilId) kiwiParams.push(`aff_id=${enc(AFFILIATE.kiwitaxiAffilId)}`);
  const transfersUrl = `https://kiwitaxi.com/?${kiwiParams.join("&")}`;

  /* -------------------- */
  /* Insurance: SafetyWing */
  /* -------------------- */
  // Stable entry (affiliate tracking varies by program).
  const swParams: string[] = [];
  if (AFFILIATE.safetywingAffilId) swParams.push(`aff=${enc(AFFILIATE.safetywingAffilId)}`);
  const insuranceUrl = swParams.length
    ? `https://safetywing.com/?${swParams.join("&")}`
    : `https://safetywing.com/`;

  /* -------------------- */
  /* Claims: AirHelp */
  /* -------------------- */
  // Stable entry (affiliate tracking varies by program).
  const ahParams: string[] = [];
  if (AFFILIATE.airhelpAffilId) ahParams.push(`aff=${enc(AFFILIATE.airhelpAffilId)}`);
  const claimsUrl = ahParams.length ? `https://www.airhelp.com/?${ahParams.join("&")}` : `https://www.airhelp.com/`;

  /* -------------------- */
  /* Tickets: SportsEvents365 */
  /* -------------------- */
  // Stable entry: their site is event-driven; query city as best-effort.
  const seParams: string[] = [`q=${enc(query)}`];
  if (AFFILIATE.sportsevents365AffilId) seParams.push(`aff=${enc(AFFILIATE.sportsevents365AffilId)}`);
  const ticketsUrl = `https://www.sportsevents365.com/?${seParams.join("&")}`;

  /* -------------------- */
  /* Maps: Google Maps search (UNTRACKED) */
  /* -------------------- */
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
    transfersUrl,
    insuranceUrl,
    claimsUrl,
    ticketsUrl,
  };
}

/**
 * Simple helper for comparisons / dedupe.
 */
export function normalizeUrlForCompare(url: string): string {
  return String(url ?? "").trim().toLowerCase();
}
