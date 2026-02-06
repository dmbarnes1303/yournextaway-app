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

/**
 * Append query params to an existing URL safely.
 * - preserves existing query string (your tracking params)
 * - merges additional keys
 */
function withQuery(baseUrl: string, params: Record<string, string | undefined>) {
  const raw = String(baseUrl ?? "").trim();
  if (!raw) return "";

  try {
    const u = new URL(raw);
    for (const [k, v] of Object.entries(params)) {
      const vv = String(v ?? "").trim();
      if (!vv) continue;
      u.searchParams.set(k, vv);
    }
    return u.toString();
  } catch {
    // Worst-case: naive append
    const pairs = Object.entries(params)
      .map(([k, v]) => {
        const vv = String(v ?? "").trim();
        return vv ? `${enc(k)}=${enc(vv)}` : "";
      })
      .filter(Boolean);

    if (pairs.length === 0) return raw;
    return raw + (raw.includes("?") ? "&" : "?") + pairs.join("&");
  }
}

/* -------------------------------------------------------------------------- */
/* affiliate config */
/* -------------------------------------------------------------------------- */

/**
 * IDs for partners you already have approved:
 * - Aviasales marker (if you have it)
 * - GetYourGuide partner ID (if you have it)
 * - Expedia affiliate ID optional (program-specific)
 *
 * Tracking base links (hard-coded as per what you pasted):
 * - KiwiTaxi / AirHelp / SafetyWing / SportsEvents365
 */
const AFFILIATE = {
  aviasalesMarker: env("EXPO_PUBLIC_AVIASALES_MARKER"),
  gygPartnerId: env("EXPO_PUBLIC_GYG_PARTNER_ID"),
  expediaAffilId: env("EXPO_PUBLIC_EXPEDIA_AFFIL_ID"),

  // ✅ exact tracking links you provided
  kiwitaxiBase: "https://kiwitaxi.tpm.lv/ZnnAV8eH",
  airhelpBase: "https://airhelp.tpm.lv/6tipSUue",
  safetywingBase: "https://safetywing.com/?referenceID=26471369&utm_source=26471369&utm_medium=Ambassador",
  sportsevents365Base: "https://www.sportsevents365.com/?a_aid=69834e80ec9d3",
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
  /* Hotels: Expedia */
  /* -------------------- */
  const expediaParams: string[] = [`destination=${enc(query)}`];
  if (startDate) expediaParams.push(`startDate=${enc(startDate)}`);
  if (endDate) expediaParams.push(`endDate=${enc(endDate)}`);
  if (AFFILIATE.expediaAffilId) expediaParams.push(`affcid=${enc(AFFILIATE.expediaAffilId)}`);
  const hotelsUrl = `https://www.expedia.co.uk/Hotel-Search?${expediaParams.join("&")}`;

  /* -------------------- */
  /* Flights: Aviasales */
  /* -------------------- */
  const aviaParams: string[] = [];
  if (AFFILIATE.aviasalesMarker) aviaParams.push(`marker=${enc(AFFILIATE.aviasalesMarker)}`);
  aviaParams.push(`destination=${enc(query)}`);
  const flightsUrl = `https://www.aviasales.com/?${aviaParams.join("&")}`;

  /* -------------------- */
  /* Trains/Buses: fallback (UNTRACKED until affiliate) */
  /* -------------------- */
  const trainsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(`${query} train station`)}`;

  /* -------------------- */
  /* Experiences: GetYourGuide */
  /* -------------------- */
  const gygParams: string[] = [`q=${enc(query)}`];
  if (AFFILIATE.gygPartnerId) gygParams.push(`partner_id=${enc(AFFILIATE.gygPartnerId)}`);
  const experiencesUrl = `https://www.getyourguide.com/s/?${gygParams.join("&")}`;

  /* -------------------- */
  /* Transfers: KiwiTaxi (TRACKED) */
  /* -------------------- */
  // We keep your tracking link intact and just add a query hint.
  const transfersUrl = withQuery(AFFILIATE.kiwitaxiBase, { city: query });

  /* -------------------- */
  /* Insurance: SafetyWing (TRACKED) */
  /* -------------------- */
  // Tracking already embedded; add optional destination hint if you want.
  const insuranceUrl = withQuery(AFFILIATE.safetywingBase, { destination: query });

  /* -------------------- */
  /* Claims: AirHelp (TRACKED) */
  /* -------------------- */
  const claimsUrl = withQuery(AFFILIATE.airhelpBase, { city: query });

  /* -------------------- */
  /* Tickets: SportsEvents365 (TRACKED) */
  /* -------------------- */
  const ticketsUrl = withQuery(AFFILIATE.sportsevents365Base, { q: query });

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

export function normalizeUrlForCompare(url: string): string {
  return String(url ?? "").trim().toLowerCase();
}
