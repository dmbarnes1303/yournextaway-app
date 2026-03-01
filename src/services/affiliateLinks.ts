// src/services/affiliateLinks.ts
// Central affiliate link builders.
// Contract: MUST NEVER crash UI. Always return safe URLs.

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

export type CabinClass = "economy" | "premium" | "business" | "first";

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

function appendQuery(base: string, params: Record<string, string | null | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => clean(v));
  if (!entries.length) return base;

  const joiner = base.includes("?") ? "&" : "?";
  const qs = entries.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&");
  return `${base}${joiner}${qs}`;
}

/**
 * Builds partner links with best-effort prefill.
 * Where possible: uses real tracked URLs.
 * Where fragile: uses stable partner “affiliate landing” patterns.
 */
export function buildAffiliateLinks(args: {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;

  passengers?: number | null; // total pax (1–9)
  cabinClass?: CabinClass | null;
}) {
  const cfg = AffiliateConfig ?? ({} as any);

  const cityName = clean(args.city);
  const startDate = ymdOrNull(args.startDate);
  const endDate = ymdOrNull(args.endDate);

  const origin = clean(args.originIata) || "LON";
  const dest = getIataCityCodeForCity(cityName);

  const passengers = clampInt(args.passengers, 1, 9, 1);
  const cabinClass: CabinClass = (clean(args.cabinClass) as CabinClass) || "economy";

  /* -------------------- */
  /* Flights — Aviasales  */
  /* -------------------- */
  // Prefer true prefill + tracking (marker).
  // Fallback to your Travelpayouts short link if marker or dates are missing.
  let flightsUrl = `https://www.google.com/search?q=${enc(cityName + " flights")}`;

  if (dest && startDate && clean(cfg.aviasalesMarker)) {
    const out = yyyymmdd(startDate);
    const base = `https://www.aviasales.com/search/${origin}${dest}${out}1?marker=${enc(cfg.aviasalesMarker)}`;

    // Best-effort extras:
    // - return date from trip end
    // - passengers (adults)
    // - cabin class
    const ret = yyyymmdd(endDate);
    flightsUrl = appendQuery(base, {
      return_date: ret,
      adults: passengers !== 1 ? String(passengers) : null,
      cabin: cabinClass !== "economy" ? cabinClass : null,
    });
  } else if (clean(cfg.aviasalesTracked)) {
    flightsUrl = cfg.aviasalesTracked;
  }

  /* -------------------- */
  /* Hotels — Expedia     */
  /* -------------------- */
  // Expedia affiliate token link is stable.
  // Date-prefill on Expedia affiliate URLs is messy; we only append best-effort params.
  let hotelsUrl = `https://www.google.com/search?q=${enc(cityName + " hotels")}`;

  if (clean(cfg.expediaToken)) {
    const slug = slugCity(cityName);
    hotelsUrl = `https://expedia.com/affiliates/hotel-search-${slug}.${cfg.expediaToken}`;

    // Best-effort: append common date params (Expedia will ignore unknown safely).
    hotelsUrl = appendQuery(hotelsUrl, {
      startDate: startDate,
      endDate: endDate,
      adults: String(passengers),
    });
  }

  /* -------------------- */
  /* Transfers — KiwiTaxi */
  /* -------------------- */
  const transfersUrl =
    clean(cfg.kiwitaxiTracked) ||
    `https://www.google.com/search?q=${enc(cityName + " airport transfer")}`;

  /* -------------------- */
  /* Tickets — SportsEvents365 (generic fallback) */
  /* -------------------- */
  const ticketsUrl =
    clean(cfg.sportsevents365Tracked) ||
    `https://www.google.com/search?q=${enc(cityName + " football tickets")}`;

  /* -------------------- */
  /* Experiences — GetYourGuide */
  /* -------------------- */
  // Use search with partner_id tracking. This is robust + works everywhere.
  let experiencesUrl = `https://www.google.com/search?q=${enc(cityName + " things to do")}`;
  if (clean(cfg.getyourguidePartnerId)) {
    experiencesUrl = `https://www.getyourguide.com/s/?q=${enc(cityName)}&partner_id=${enc(
      cfg.getyourguidePartnerId
    )}`;
  }

  /* -------------------- */
  /* Maps */
  /* -------------------- */
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(cityName)}`;

  return {
    flightsUrl,
    hotelsUrl,
    transfersUrl,
    ticketsUrl,
    experiencesUrl,
    mapsUrl,
  };
}
