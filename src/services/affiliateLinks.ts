// src/services/affiliateLinks.ts
// Centralised affiliate link builders + safe defaults.
// MUST NEVER crash the UI if partner config is missing.

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

type AffiliateCfg = {
  aviasalesMarker?: string;
  safetywingTracked?: string;
  airhelpTracked?: string;
  // Optional tracked bases (future proof)
  expediaStaysTracked?: string;
  expediaCarsTracked?: string;
  getyourguideTracked?: string;
  tiqetsTracked?: string;
  kiwitaxiTracked?: string;
  sportsevents365Tracked?: string;
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
  // Accept Date-ish ISO strings or already YYYY-MM-DD.
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

/**
 * Builds partner links with best-effort prefill.
 * Contract: return keys used by Trip workspace.
 *
 * NOTE: For now, many links use Google intent searches (reliable + prefilled).
 * Tracked URLs can be swapped in later when stable deep-link formats are implemented.
 */
export function buildAffiliateLinks(args: {
  city: string;

  // optional: city country info (not required for current link building)
  countryCode?: string | null;

  // accept both naming conventions (Trip screen uses startDate/endDate)
  startDate?: string | null;
  endDate?: string | null;

  // older naming (some screens may still use these)
  startDateIso?: string | null;
  endDateIso?: string | null;

  originIata?: string | null;
}) {
  const cfg = safeObj<AffiliateCfg>((AffiliateConfig as any) ?? null);

  const cityRaw = clean(args.city);
  const query = cityRaw || "city";

  const startDate = ymdOrNullFromAny(args.startDate ?? args.startDateIso);
  const endDate = ymdOrNullFromAny(args.endDate ?? args.endDateIso);

  const originIata = clean(args.originIata) || "LON";
  const destIata = cityRaw ? getIataCityCodeForCity(cityRaw) : null;

  const dateHint =
    startDate && endDate ? `${startDate} to ${endDate}` : startDate ? startDate : "";

  /* -------------------- */
  /* Flights (Aviasales)  */
  /* -------------------- */
  const aviasalesMarker = clean(cfg.aviasalesMarker);
  const flightsUrl =
    destIata && startDate && aviasalesMarker
      ? `https://www.aviasales.com/search/${enc(originIata)}${enc(destIata)}${startDate.replace(/-/g, "")}1?marker=${enc(
          aviasalesMarker
        )}`
      : `https://www.google.com/search?q=${enc([query, "flights"].join(" "))}`;

  /* -------------------- */
  /* Hotels (Expedia)     */
  /* -------------------- */
  // Keep reliable intent search until you implement stable deep links.
  const hotelsUrl = `https://www.google.com/search?q=${enc(
    [query, "hotels", startDate, endDate].filter(Boolean).join(" ")
  )}`;

  /* -------------------- */
  /* Car hire             */
  /* -------------------- */
  const carHireUrl = `https://www.google.com/search?q=${enc(
    [query, "car hire", startDate, endDate].filter(Boolean).join(" ")
  )}`;

  /* -------------------- */
  /* Experiences          */
  /* -------------------- */
  const experiencesUrl = `https://www.google.com/search?q=${enc(
    [query, "things to do"].join(" ")
  )}`;

  /* -------------------- */
  /* Transfers / Tickets  */
  /* -------------------- */
  const transfersUrl = `https://www.google.com/search?q=${enc(
    ["kiwitaxi", query, dateHint, "airport transfer"].filter(Boolean).join(" ")
  )}`;

  const ticketsUrl = `https://www.google.com/search?q=${enc(
    ["sportsevents365", query, "tickets"].filter(Boolean).join(" ")
  )}`;

  /* -------------------- */
  /* Insurance / Claims   */
  /* -------------------- */
  // These MUST be safe even if cfg is missing.
  const insuranceUrl = pickFirstUrl(cfg.safetywingTracked, null) ?? `https://www.google.com/search?q=${enc([query, "travel insurance"].join(" "))}`;
  const claimsUrl = pickFirstUrl(cfg.airhelpTracked, null) ?? `https://www.google.com/search?q=${enc(["flight compensation", "AirHelp"].join(" "))}`;

  /* -------------------- */
  /* Maps                 */
  /* -------------------- */
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(query)}`;

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
