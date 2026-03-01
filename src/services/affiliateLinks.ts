// src/services/affiliateLinks.ts
// Centralised affiliate link builders + safe defaults.

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

const AFFILIATE = AffiliateConfig;

function enc(v: string) {
  return encodeURIComponent(String(v ?? "").trim());
}

function clean(v: any): string {
  return String(v ?? "").trim();
}

function ymdOrNull(iso: string | null): string | null {
  const s = clean(iso);
  if (!s) return null;
  try {
    return formatIsoToYmd(s);
  } catch {
    return null;
  }
}

/**
 * Builds partner links with best-effort prefill.
 * NOTE: some partners do not support stable deep-link prefill without breaking attribution;
 * for demo flows we prioritise "works reliably" and use intent-prefilled fallbacks.
 */
export function buildAffiliateLinks(args: {
  city: string;
  countryCode: string | null;
  startDateIso: string | null;
  endDateIso: string | null;
  originIata?: string | null;
}) {
  const cityRaw = clean(args.city);
  const query = cityRaw || "city";

  const countryCode = clean(args.countryCode) || null;

  const startDate = ymdOrNull(args.startDateIso);
  const endDate = ymdOrNull(args.endDateIso);

  const originIata = clean(args.originIata) || "LON";
  const destIata = cityRaw ? getIataCityCodeForCity(cityRaw) : null;

  /* -------------------- */
  /* Flights (Aviasales) */
  /* -------------------- */
  const flightsUrl =
    destIata && startDate
      ? `https://www.aviasales.com/search/${enc(originIata)}${enc(destIata)}${startDate.replaceAll("-", "")}1?marker=${enc(
          AFFILIATE.aviasalesMarker
        )}`
      : // Fallback: query search (still useful)
        `https://www.google.com/search?q=${enc([query, "flights"].join(" "))}`;

  /* -------------------- */
  /* Stays (Expedia) */
  /* -------------------- */
  // Expedia deep link formats vary; keep a stable intent prefill.
  const staysUrl = `https://www.google.com/search?q=${enc([query, "hotels", startDate, endDate].filter(Boolean).join(" "))}`;

  /* -------------------- */
  /* Car hire (Expedia) */
  /* -------------------- */
  const carHireUrl = `https://www.google.com/search?q=${enc([query, "car hire", startDate, endDate].filter(Boolean).join(" "))}`;

  /* -------------------- */
  /* Activities (GetYourGuide / Tiqets etc.) */
  /* -------------------- */
  const activitiesUrl = `https://www.google.com/search?q=${enc([query, "things to do"].join(" "))}`;

  /* -------------------- */
  /* Transfers / Insurance / Claims / Tickets */
  /* -------------------- */
  // Demo-first behaviour:
  // Transfers & Tickets need to land on something relevant immediately.
  // Many affiliate shortlinks don't safely accept arbitrary search parameters,
  // so (for now) we use a Google site-search which *is* prefilled.
  // We keep the tracked bases in AffiliateConfig so we can swap back once we
  // implement partner-supported deep-link formats.

  const dateHint = startDate && endDate ? `${startDate} to ${endDate}` : startDate ? startDate : "";

  const transfersUrl = `https://www.google.com/search?q=${enc(
    ["kiwitaxi", query, dateHint, "airport transfer"].filter(Boolean).join(" ")
  )}`;

  const ticketsUrl = `https://www.google.com/search?q=${enc(
    ["sportsevents365", query, "tickets"].filter(Boolean).join(" ")
  )}`;

  const insuranceUrl = AFFILIATE.safetywingTracked;
  const claimsUrl = AFFILIATE.airhelpTracked;

  return {
    flightsUrl,
    staysUrl,
    carHireUrl,
    insuranceUrl,
    claimsUrl,
    activitiesUrl,
    transfersUrl,
    ticketsUrl,
  };
}
