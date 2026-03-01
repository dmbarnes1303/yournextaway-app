// src/services/affiliateLinks.ts

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

type CabinClass = "economy" | "premium" | "business" | "first";

function enc(v: any) {
  return encodeURIComponent(String(v ?? "").trim());
}

function clean(v: any): string {
  return String(v ?? "").trim();
}

function ymdOrNull(v: any): string | null {
  const s = clean(v);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  try {
    return formatIsoToYmd(s);
  } catch {
    return null;
  }
}

function yyyymmdd(date: string | null): string | null {
  if (!date) return null;
  return date.replace(/-/g, "");
}

function slugCity(city: string) {
  return clean(city)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function clampInt(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return Math.max(min, Math.min(max, i));
}

/**
 * Builds partner links with best-effort prefill.
 * IMPORTANT: Must never crash UI. Always return safe URLs.
 */
export function buildAffiliateLinks(args: {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;

  // new optional enhancements
  passengers?: number | null; // total passengers
  cabinClass?: CabinClass | null;
}) {
  const cfg = AffiliateConfig ?? {};
  const city = clean(args.city);

  const startDate = ymdOrNull(args.startDate);
  const endDate = ymdOrNull(args.endDate);

  const origin = clean(args.originIata) || "LON";
  const dest = getIataCityCodeForCity(city);

  const passengers = clampInt(args.passengers, 1, 9, 1); // 1–9
  const cabinClass: CabinClass = (clean(args.cabinClass) as CabinClass) || "economy";

  /* -------------------- */
  /* Flights — Aviasales  */
  /* -------------------- */
  // We build a direct aviasales search URL for true prefill.
  // marker is your Travelpayouts id (495355).
  //
  // Outbound date required for prefill. Return date optional (auto from trip end).
  // Passengers and cabin are appended as query params (best-effort; Aviasales ignores unknown params safely).
  let flightsUrl = `https://www.google.com/search?q=${enc(city + " flights")}`;

  if (dest && startDate) {
    const out = yyyymmdd(startDate);
    const ret = yyyymmdd(endDate); // auto-return date from trip end (if provided)

    // Base pattern (works): /search/ORIGDESTYYYYMMDD1?marker=...
    // If return date exists, we add it as query param (best-effort).
    const base = `https://www.aviasales.com/search/${origin}${dest}${out}1?marker=495355`;

    const extraParams: string[] = [];
    if (ret) extraParams.push(`return_date=${enc(ret)}`);
    if (passengers && passengers !== 1) extraParams.push(`adults=${enc(passengers)}`);
    if (cabinClass && cabinClass !== "economy") extraParams.push(`cabin=${enc(cabinClass)}`);

    flightsUrl = extraParams.length ? `${base}&${extraParams.join("&")}` : base;
  } else if (cfg.aviasalesTracked) {
    // fallback tracked link if we can't prefill
    flightsUrl = cfg.aviasalesTracked;
  }

  /* -------------------- */
  /* Hotels — Expedia     */
  /* -------------------- */
  let hotelsUrl = `https://www.google.com/search?q=${enc(city + " hotels")}`;

  if (cfg.expediaToken) {
    const slug = slugCity(city);
    hotelsUrl = `https://expedia.com/affiliates/hotel-search-${slug}.${cfg.expediaToken}`;
  }

  // If you later find an Expedia format that supports check-in/out parameters reliably,
  // we can append them here. For now: stable token link beats fragile params.

  /* -------------------- */
  /* Transfers — KiwiTaxi */
  /* -------------------- */
  const transfersUrl =
    cfg.kiwitaxiTracked ||
    `https://www.google.com/search?q=${enc(city + " airport transfer")}`;

  /* -------------------- */
  /* Tickets — SportsEvents365 */
  /* -------------------- */
  const ticketsUrl =
    cfg.sportsevents365Tracked ||
    `https://www.google.com/search?q=${enc(city + " football tickets")}`;

  /* -------------------- */
  /* Experiences — GetYourGuide */
  /* -------------------- */
  const experiencesUrl =
    cfg.getyourguideTracked ||
    `https://www.google.com/search?q=${enc(city + " things to do")}`;

  /* -------------------- */
  /* Maps */
  /* -------------------- */
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(city)}`;

  return {
    flightsUrl,
    hotelsUrl,
    transfersUrl,
    ticketsUrl,
    experiencesUrl,
    mapsUrl,
  };
}
