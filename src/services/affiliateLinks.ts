// src/services/affiliateLinks.ts
import Constants from "expo-constants";

/**
 * Centralised affiliate URL builder.
 *
 * RULES (Phase-1 spine):
 * - This file ONLY builds URLs.
 * - Partner IDs live in src/core/partners.ts
 * - Keep output keys stable to avoid screen refactors.
 *
 * CRITICAL COMMISSION RULE:
 * - Do NOT append extra query params to third-party tracking links (TPM, etc).
 *   Many tracking/redirect systems do not guarantee passthrough and can break attribution.
 *   Keep those tracking URLs EXACT.
 */

export type AffiliateLinks = {
  city: string;
  country?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD

  // Legacy (already used by screens)
  hotelsUrl: string; // Expedia
  flightsUrl: string; // Aviasales
  trainsUrl: string; // fallback (untracked)
  experiencesUrl: string; // GetYourGuide
  mapsUrl: string; // Google Maps (untracked)

  // Approved additions (Phase 1)
  transfersUrl: string; // KiwiTaxi (tracked)
  insuranceUrl: string; // SafetyWing (tracked)
  claimsUrl: string; // AirHelp (tracked)
  ticketsUrl: string; // SportsEvents365 (tracked)
};

/* -------------------------------------------------------------------------- */
/* helpers */
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
/* affiliate config */
/* -------------------------------------------------------------------------- */

/**
 * Put IDs in app.json -> expo.extra and/or .env as EXPO_PUBLIC_*.
 *
 * You currently have approved:
 * - Expedia (program-specific linking varies; we use a stable public entry)
 * - Aviasales (marker-based in many setups)
 * - GetYourGuide (partner_id)
 * - KiwiTaxi / AirHelp via TPM tracking links
 * - SafetyWing direct tracking link
 * - SportsEvents365 a_aid param
 */
const AFFILIATE = {
  // Optional IDs (safe if missing)
  aviasalesMarker: env("EXPO_PUBLIC_AVIASALES_MARKER"),
  gygPartnerId: env("EXPO_PUBLIC_GYG_PARTNER_ID"),
  expediaAffilId: env("EXPO_PUBLIC_EXPEDIA_AFFIL_ID"),

  // ✅ EXACT tracking links provided by you (DO NOT MODIFY)
  kiwitaxiTracked: "https://kiwitaxi.tpm.lv/ZnnAV8eH",
  airhelpTracked: "https://airhelp.tpm.lv/6tipSUue",
  safetywingTracked:
    "https://safetywing.com/?referenceID=26471369&utm_source=26471369&utm_medium=Ambassador",
  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=69834e80ec9d3",
};

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
  // Stable public entry point. Some affiliate programs require different deep-link formats;
  // we keep this resilient and optionally add a generic affcid.
  const expediaParams: string[] = [`destination=${enc(query)}`];
  if (startDate) expediaParams.push(`startDate=${enc(startDate)}`);
  if (endDate) expediaParams.push(`endDate=${enc(endDate)}`);
  if (AFFILIATE.expediaAffilId) expediaParams.push(`affcid=${enc(AFFILIATE.expediaAffilId)}`);
  const hotelsUrl = `https://www.expedia.co.uk/Hotel-Search?${expediaParams.join("&")}`;

  /* -------------------- */
  /* Flights: Aviasales (approved) */
  /* -------------------- */
  const aviaParams: string[] = [];
  if (AFFILIATE.aviasalesMarker) aviaParams.push(`marker=${enc(AFFILIATE.aviasalesMarker)}`);
  // Keep destination hint; harmless if ignored.
  aviaParams.push(`destination=${enc(query)}`);
  const flightsUrl = `https://www.aviasales.com/?${aviaParams.join("&")}`;

  /* -------------------- */
  /* Trains/Buses: fallback (UNTRACKED until affiliate) */
  /* -------------------- */
  const trainsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(
    `${query} train station`
  )}`;

  /* -------------------- */
  /* Experiences: GetYourGuide (approved) */
  /* -------------------- */
  // Correct search format: /s/?q=<query>&partner_id=<id>
  const gygParams: string[] = [`q=${enc(query)}`];
  if (AFFILIATE.gygPartnerId) gygParams.push(`partner_id=${enc(AFFILIATE.gygPartnerId)}`);
  const experiencesUrl = `https://www.getyourguide.com/s/?${gygParams.join("&")}`;

  /* -------------------- */
  /* Transfers / Insurance / Claims / Tickets: TRACKED BASE LINKS (EXACT) */
  /* -------------------- */
  // Do not append extra params to tracking URLs. Keep attribution clean.
  const transfersUrl = AFFILIATE.kiwitaxiTracked;
  const insuranceUrl = AFFILIATE.safetywingTracked;
  const claimsUrl = AFFILIATE.airhelpTracked;
  const ticketsUrl = AFFILIATE.sportsevents365Tracked;

  /* -------------------- */
  /* Maps: Google Maps (UNTRACKED) */
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

export function normalizeUrlForCompare(url: string): string {
  return String(url ?? "").trim().toLowerCase();
}
