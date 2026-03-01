// src/services/affiliateLinks.ts
// Centralised affiliate link builders + safe defaults.
// MUST NEVER crash the UI if partner config is missing.

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

type AffiliateCfg = {
  // Flights (Aviasales)
  aviasalesMarker?: string;

  // Expedia (Creator Program tracked URL, typically expedia.com/affiliates/hotel-search-<city>.<TOKEN>)
  expediaStaysTracked?: string;

  // Other tracked bases
  getyourguideTracked?: string;
  tiqetsTracked?: string;
  klookTracked?: string;

  kiwitaxiTracked?: string;
  sportsevents365Tracked?: string;

  // Insurance / Claims
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

function pickFirstUrl(...candidates: Array<string | null | undefined>) {
  for (const c of candidates) {
    const s = clean(c);
    if (s) return s;
  }
  return null;
}

function slugCity(input: string) {
  return clean(input)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function appendQuery(baseUrl: string, params: Record<string, string | null | undefined>) {
  const b = clean(baseUrl);
  if (!b) return b;

  const entries = Object.entries(params).filter(([, v]) => clean(v));
  if (!entries.length) return b;

  const joiner = b.includes("?") ? "&" : "?";
  const qs = entries.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&");
  return `${b}${joiner}${qs}`;
}

/**
 * Builds partner links with best-effort prefill.
 * Contract: MUST NOT throw. Always return usable URLs.
 *
 * Dates:
 * - Accepts startDate/endDate (preferred)
 * - Also supports older startDateIso/endDateIso
 *
 * Prefill reality check:
 * - Aviasales: solid (we can prefill route + date + marker)
 * - Expedia Creator Program token links: we can append dates as query params,
 *   but Expedia may ignore unknown params depending on program implementation.
 *   Still worth doing; worst case it’s ignored, best case it prefills.
 */
export function buildAffiliateLinks(args: {
  city: string;
  countryCode?: string | null;

  startDate?: string | null;
  endDate?: string | null;

  // legacy naming support
  startDateIso?: string | null;
  endDateIso?: string | null;

  originIata?: string | null;
}) {
  const cfg = safeObj<AffiliateCfg>((AffiliateConfig as any) ?? {});

  const cityRaw = clean(args.city);
  const citySlug = slugCity(cityRaw);
  const queryCity = cityRaw || "city";

  const startDate = ymdOrNullFromAny(args.startDate ?? args.startDateIso);
  const endDate = ymdOrNullFromAny(args.endDate ?? args.endDateIso);

  const originIata = clean(args.originIata) || "LON";
  const destIata = cityRaw ? getIataCityCodeForCity(cityRaw) : null;

  /* -------------------- */
  /* Flights — Aviasales   */
  /* -------------------- */
  const aviasalesMarker = clean(cfg.aviasalesMarker);

  // Aviasales tracked search format (best option because it actually prefills and tracks via marker)
  // Example: https://www.aviasales.com/search/LONPMI202603071?marker=XXXX
  const flightsUrl =
    destIata && startDate && aviasalesMarker
      ? `https://www.aviasales.com/search/${enc(originIata)}${enc(destIata)}${startDate.replace(/-/g, "")}1?marker=${enc(
          aviasalesMarker
        )}`
      : `https://www.google.com/search?q=${enc(`${queryCity} flights`)}`;

  /* -------------------- */
  /* Hotels — Expedia      */
  /* -------------------- */
  // Goal: use your Expedia Creator Program tracked URL, but swap the city slug and keep the token.
  // Your example: https://expedia.com/affiliates/hotel-search-dortmund.HQeXTbR
  // We rebuild:    https://expedia.com/affiliates/hotel-search-<citySlug>.<TOKEN>
  let hotelsBase: string | null = null;

  const expediaTracked = clean(cfg.expediaStaysTracked);

  if (expediaTracked) {
    // Extract token from the *end* of the tracked link.
    // Matches: affiliates/hotel-search-<anything>.<TOKEN>
    const m = expediaTracked.match(/\/affiliates\/hotel-search-[^.]+\.(.+)$/i);
    const token = clean(m?.[1]);

    hotelsBase = token
      ? `https://expedia.com/affiliates/hotel-search-${citySlug || "city"}.${token}`
      : expediaTracked; // fallback to whatever user stored
  } else {
    // Fallback to a normal Expedia destination search (not guaranteed to prefill perfectly, but better than Google).
    // This is NOT tracked unless Expedia program tags are embedded elsewhere.
    hotelsBase = `https://www.expedia.co.uk/Hotel-Search?destination=${enc(queryCity)}`;
  }

  // Attempt to prefill dates (these param names may be ignored depending on Expedia affiliate implementation)
  const hotelsUrl = appendQuery(hotelsBase, {
    startDate: startDate,
    endDate: endDate,
    checkIn: startDate,
    checkOut: endDate,
  });

  /* -------------------- */
  /* Transfers — KiwiTaxi  */
  /* -------------------- */
  const transfersBase =
    pickFirstUrl(cfg.kiwitaxiTracked) ??
    `https://www.google.com/search?q=${enc(`${queryCity} airport transfer`)}`;

  // KiwiTaxi deep link formats vary; we won’t invent params.
  // But we *do* add a harmless query hint when it’s a Google fallback.
  const transfersUrl = transfersBase.includes("google.com/search")
    ? appendQuery(transfersBase, { q: `${queryCity} airport transfer ${startDate ?? ""}`.trim() })
    : transfersBase;

  /* -------------------- */
  /* Tickets — SportsEvents365 */
  /* -------------------- */
  const ticketsBase =
    pickFirstUrl(cfg.sportsevents365Tracked) ??
    `https://www.google.com/search?q=${enc(`${queryCity} football tickets`)}`;

  // SportsEvents365 supports searching/browsing internally; we won’t guess their params.
  // If you want *real* prefill, you need fixture->event URL mapping later.
  const ticketsUrl = ticketsBase;

  /* -------------------- */
  /* Experiences — GetYourGuide / others */
  /* -------------------- */
  const gygTracked = clean(cfg.getyourguideTracked);
  let experiencesUrl: string;

  if (gygTracked) {
    // Most reliable: route to GYG search with q=
    const base = gygTracked.replace(/\/+$/, "");
    experiencesUrl = `${base}/s/?q=${enc(queryCity)}`;
  } else if (clean(cfg.tiqetsTracked)) {
    experiencesUrl = clean(cfg.tiqetsTracked)!;
  } else if (clean(cfg.klookTracked)) {
    experiencesUrl = clean(cfg.klookTracked)!;
  } else {
    experiencesUrl = `https://www.google.com/search?q=${enc(`${queryCity} things to do`)}`;
  }

  /* -------------------- */
  /* Insurance / Claims    */
  /* -------------------- */
  const insuranceUrl =
    pickFirstUrl(cfg.safetywingTracked) ??
    `https://www.google.com/search?q=${enc(`${queryCity} travel insurance`)}`;

  const claimsUrl =
    pickFirstUrl(cfg.airhelpTracked) ??
    `https://www.google.com/search?q=${enc(`flight compensation AirHelp`)}`;

  /* -------------------- */
  /* Maps                  */
  /* -------------------- */
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(queryCity)}`;

  /* -------------------- */
  /* Keep extra links stable (so other screens don't break) */
  /* -------------------- */
  const carHireUrl = `https://www.google.com/search?q=${enc(
    [queryCity, "car hire", startDate, endDate].filter(Boolean).join(" ")
  )}`;

  return {
    flightsUrl,
    hotelsUrl,
    transfersUrl,
    ticketsUrl,
    experiencesUrl,
    mapsUrl,

    // keep legacy keys (safe defaults)
    carHireUrl,
    insuranceUrl,
    claimsUrl,
  };
}
