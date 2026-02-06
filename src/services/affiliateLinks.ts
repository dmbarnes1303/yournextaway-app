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
 * Keep the output shape stable so screens don't need refactors:
 * { hotelsUrl, flightsUrl, trainsUrl, experiencesUrl, mapsUrl }
 */

export type AffiliateLinks = {
  city: string;
  country?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD

  hotelsUrl: string; // Expedia (approved)
  flightsUrl: string; // AVIASALES (approved)
  trainsUrl: string; // fallback (no trains affiliate approved yet)
  experiencesUrl: string; // GetYourGuide (approved)
  mapsUrl: string; // Google Maps
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
 * Put IDs in app.json -> expo.extra and/or .env as EXPO_PUBLIC_*.
 *
 * Suggested env keys (you can rename later, but keep consistent once live):
 * - EXPO_PUBLIC_AVIASALES_MARKER
 * - EXPO_PUBLIC_GYG_PARTNER_ID
 * - EXPO_PUBLIC_EXPEDIA_AFFIL_ID   (optional; expedia affiliate deep links vary by program)
 */
const AFFILIATE = {
  aviasalesMarker: env("EXPO_PUBLIC_AVIASALES_MARKER"),
  gygPartnerId: env("EXPO_PUBLIC_GYG_PARTNER_ID"),
  expediaAffilId: env("EXPO_PUBLIC_EXPEDIA_AFFIL_ID"),
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
  /* Hotels: Expedia (approved) */
  /* -------------------- */
  // Expedia URLs can vary by locale/program; this is a stable public search entry.
  // If you have an affiliate ID, we append it as a generic affcid for now (harmless if ignored).
  const expediaParams: string[] = [`destination=${enc(query)}`];
  if (startDate) expediaParams.push(`startDate=${enc(startDate)}`);
  if (endDate) expediaParams.push(`endDate=${enc(endDate)}`);
  if (AFFILIATE.expediaAffilId) expediaParams.push(`affcid=${enc(AFFILIATE.expediaAffilId)}`);

  const hotelsUrl = `https://www.expedia.co.uk/Hotel-Search?${expediaParams.join("&")}`;

  /* -------------------- */
  /* Flights: AVIASALES (approved) */
  /* -------------------- */
  // AVIASALES commonly uses a "marker" for attribution in many affiliate setups.
  // We keep this resilient: even without marker, it remains a working entry page.
  const aviaParams: string[] = [];
  if (AFFILIATE.aviasalesMarker) aviaParams.push(`marker=${enc(AFFILIATE.aviasalesMarker)}`);
  // Best-effort: pass destination as a query hint (Aviasales will still work if ignored).
  aviaParams.push(`destination=${enc(query)}`);

  const flightsUrl = `https://www.aviasales.com/?${aviaParams.join("&")}`;

  /* -------------------- */
  /* Trains: fallback (no trains affiliate approved yet) */
  /* -------------------- */
  // Keep "trainsUrl" for screen compatibility, but route to a reasonable transit search.
  // This is intentionally UNTRACKED for now.
  const trainsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(`${query} train`)}`;

  /* -------------------- */
  /* Experiences: GetYourGuide (approved) */
  /* -------------------- */
  // Correct search format:
  // https://www.getyourguide.com/s/?q=<query>&partner_id=<id>
  const gygParams: string[] = [`q=${enc(query)}`];
  if (AFFILIATE.gygPartnerId) gygParams.push(`partner_id=${enc(AFFILIATE.gygPartnerId)}`);
  const experiencesUrl = `https://www.getyourguide.com/s/?${gygParams.join("&")}`;

  /* -------------------- */
  /* Maps: Google Maps search */
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
  };
}

/**
 * Simple helper for comparisons / dedupe.
 */
export function normalizeUrlForCompare(url: string): string {
  return String(url ?? "").trim().toLowerCase();
}
