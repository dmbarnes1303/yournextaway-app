// src/services/affiliateLinks.ts
// Centralised affiliate link builders + safe defaults.
// MUST NEVER crash the UI if partner config is missing.
// MUST NOT use Google fallbacks for monetised categories.

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

type AffiliateCfg = {
  aviasalesMarker?: string;

  // Optional tracked bases (recommended)
  expediaStaysTracked?: string;      // e.g. https://www.expedia.co.uk/?affcid=...
  expediaCarsTracked?: string;

  getyourguideTracked?: string;      // e.g. https://www.getyourguide.com/?partner_id=...
  tiqetsTracked?: string;

  kiwitaxiTracked?: string;          // e.g. https://kiwitaxi.com/?utm_source=...
  sportsevents365Tracked?: string;   // e.g. https://www.sportsevents365.com/?ref=...

  safetywingTracked?: string;
  airhelpTracked?: string;
};

function enc(v: any) {
  return encodeURIComponent(String(v ?? "").trim());
}

function clean(v: any): string {
  return String(v ?? "").trim();
}

function safeObj<T extends object>(v: any): T {
  return v && typeof v === "object" ? (v as T) : ({} as T);
}

function isHttpUrl(v: any): boolean {
  const s = clean(v);
  return /^https?:\/\//i.test(s);
}

function ymdOrNull(iso: string | null | undefined): string | null {
  const s = clean(iso);
  if (!s) return null;
  try {
    return formatIsoToYmd(s);
  } catch {
    return null;
  }
}

function ymdOrNullFromAny(v: any): string | null {
  const s = clean(v);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return ymdOrNull(s);
}

function addQuery(base: string, params: Record<string, any>) {
  const b = clean(base);
  if (!isHttpUrl(b)) return null;

  const qs = Object.entries(params)
    .filter(([, val]) => clean(val))
    .map(([k, val]) => `${enc(k)}=${enc(val)}`)
    .join("&");

  if (!qs) return b;
  return b.includes("?") ? `${b}&${qs}` : `${b}?${qs}`;
}

function pickFirstUrl(...candidates: Array<string | null | undefined>) {
  for (const c of candidates) {
    const s = clean(c);
    if (isHttpUrl(s)) return s;
  }
  return null;
}

/**
 * Builds partner links with best-effort prefill.
 * Contract: return keys used by Trip workspace.
 *
 * Hard rule: NO Google fallbacks for monetised categories.
 * If tracked bases are missing, we use the partner’s normal public search URLs.
 */
export function buildAffiliateLinks(args: {
  city: string;
  countryCode?: string | null;

  // accept both naming conventions
  startDate?: string | null;
  endDate?: string | null;
  startDateIso?: string | null;
  endDateIso?: string | null;

  originIata?: string | null;
}) {
  const cfg = safeObj<AffiliateCfg>((AffiliateConfig as any) ?? null);

  const cityRaw = clean(args.city);
  const city = cityRaw || "city";

  const startDate = ymdOrNullFromAny(args.startDate ?? args.startDateIso);
  const endDate = ymdOrNullFromAny(args.endDate ?? args.endDateIso);

  const originIata = clean(args.originIata) || "LON";
  const destIata = cityRaw ? getIataCityCodeForCity(cityRaw) : null;

  /* -------------------- */
  /* Flights (Aviasales)  */
  /* -------------------- */
  const aviasalesMarker = clean(cfg.aviasalesMarker);

  // Aviasales deep link with marker (best). If missing IATA/dates, open Aviasales destination search page.
  const flightsUrl =
    destIata && startDate && aviasalesMarker
      ? `https://www.aviasales.com/search/${enc(originIata)}${enc(destIata)}${startDate.replace(/-/g, "")}1?marker=${enc(
          aviasalesMarker
        )}`
      : addQuery("https://www.aviasales.com/", {
          // Not perfect, but keeps user on Aviasales instead of Google.
          // If you later add full deep-link format for flexible dates, update here.
          "search": city,
        }) ?? "https://www.aviasales.com/";

  /* -------------------- */
  /* Hotels (Expedia)     */
  /* -------------------- */
  // Prefer tracked base if you have it; otherwise normal Expedia hotel search URL.
  // Expedia’s parameters vary by locale; this is a stable-enough pattern:
  // - destination
  // - startDate / endDate (YYYY-MM-DD)
  const expediaBase = pickFirstUrl(cfg.expediaStaysTracked, "https://www.expedia.co.uk/Hotel-Search");

  const hotelsUrl =
    addQuery(expediaBase!, {
      destination: city,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
    }) ?? "https://www.expedia.co.uk/Hotel-Search";

  /* -------------------- */
  /* Car hire (Expedia)   */
  /* -------------------- */
  const expediaCarsBase = pickFirstUrl(cfg.expediaCarsTracked, "https://www.expedia.co.uk/Cars");
  const carHireUrl =
    addQuery(expediaCarsBase!, {
      // keep it simple: car hire by city; you can later enhance with airport/IATA mapping.
      "location": city,
      "startDate": startDate ?? undefined,
      "endDate": endDate ?? undefined,
    }) ?? "https://www.expedia.co.uk/Cars";

  /* -------------------- */
  /* Activities (GetYourGuide) */
  /* -------------------- */
  const gygBase = pickFirstUrl(cfg.getyourguideTracked, "https://www.getyourguide.com/s/");
  const experiencesUrl =
    // GYG’s search uses /s/?q=...
    addQuery(gygBase!, { q: city }) ?? `https://www.getyourguide.com/s/?q=${enc(city)}`;

  /* -------------------- */
  /* Transfers (Kiwitaxi) */
  /* -------------------- */
  const kiwitaxiBase = pickFirstUrl(cfg.kiwitaxiTracked, "https://kiwitaxi.com/en/search");
  const transfersUrl =
    // Keep it as a “city transfer” search, user refines pickup/dropoff.
    addQuery(kiwitaxiBase!, { place: city }) ?? `https://kiwitaxi.com/en/search?place=${enc(city)}`;

  /* -------------------- */
  /* Tickets (SportsEvents365) */
  /* -------------------- */
  const se365Base = pickFirstUrl(cfg.sportsevents365Tracked, "https://www.sportsevents365.com/search");
  const ticketsUrl =
    // This is only a general entry; match-specific tickets should use buildTicketLink().
    addQuery(se365Base!, { q: city }) ?? `https://www.sportsevents365.com/search?q=${enc(city)}`;

  /* -------------------- */
  /* Insurance / Claims   */
  /* -------------------- */
  // These are still monetised but safe fallback is the partner homepage (not Google).
  const insuranceUrl = pickFirstUrl(cfg.safetywingTracked, "https://safetywing.com/") ?? "https://safetywing.com/";
  const claimsUrl = pickFirstUrl(cfg.airhelpTracked, "https://www.airhelp.com/") ?? "https://www.airhelp.com/";

  /* -------------------- */
  /* Maps                 */
  /* -------------------- */
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(city)}`;

  return {
    flightsUrl,
    hotelsUrl,
    carHireUrl,
    experiencesUrl,
    transfersUrl,
    ticketsUrl,
    insuranceUrl,
    claimsUrl,
    mapsUrl,
  };
                                                                         }
