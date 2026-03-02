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

function appendQuery(
  base: string,
  params: Record<string, string | null | undefined>
) {
  const entries = Object.entries(params).filter(([, v]) => clean(v));
  if (!entries.length) return base;

  const joiner = base.includes("?") ? "&" : "?";
  const qs = entries.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&");
  return `${base}${joiner}${qs}`;
}

/**
 * Builds partner links with best-effort prefill + tracking.
 * Priority: if tracked config exists -> use it.
 * Prefill: add parameters where stable. If not stable, keep tracked base.
 */
export function buildAffiliateLinks(args: {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;

  passengers?: number | null; // 1–9
  cabinClass?: CabinClass | null;
}) {
  const cfg = (AffiliateConfig ?? {}) as any;

  const cityName = clean(args.city);
  const startDate = ymdOrNull(args.startDate);
  const endDate = ymdOrNull(args.endDate);

  const origin = clean(args.originIata) || "LON";
  const dest = cityName ? getIataCityCodeForCity(cityName) : null;

  const passengers = clampInt(args.passengers, 1, 9, 1);
  const cabinClass: CabinClass =
    (clean(args.cabinClass) as CabinClass) || "economy";

  /* -------------------- */
  /* Flights — Aviasales  */
  /* -------------------- */
  // Best case (paid + prefilled): Aviasales prefilled search URL with marker.
  // Fallback (paid): Travelpayouts short link.
  // Last fallback: Google search.
  let flightsUrl = `https://www.google.com/search?q=${enc(
    cityName + " flights"
  )}`;

  const marker = clean(cfg.aviasalesMarker);
  if (dest && startDate && marker) {
    const out = yyyymmdd(startDate);
    const ret = yyyymmdd(endDate);

    // Known working pattern:
    // https://www.aviasales.com/search/ORIGDESTYYYYMMDD1?marker=XXXX
    const base = `https://www.aviasales.com/search/${enc(origin)}${enc(
      dest
    )}${enc(out)}1?marker=${enc(marker)}`;

    // Best-effort extra params (ignored if unsupported):
    flightsUrl = appendQuery(base, {
      return_date: ret, // auto-return date from trip end
      adults: passengers !== 1 ? String(passengers) : null,
      cabin: cabinClass !== "economy" ? cabinClass : null,
    });
  } else if (clean(cfg.aviasalesTracked)) {
    flightsUrl = cfg.aviasalesTracked;
  }

  /* -------------------- */
  /* Hotels — Expedia     */
  /* -------------------- */
  // Paid + stable: token-based affiliate landing.
  // Prefill: best-effort query params (Expedia may ignore, but tracking remains).
  let hotelsUrl = `https://www.google.com/search?q=${enc(
    cityName + " hotels"
  )}`;

  const expediaToken = clean(cfg.expediaToken);
  if (expediaToken && cityName) {
    const slug = slugCity(cityName);
    const base = `https://expedia.com/affiliates/hotel-search-${slug}.${expediaToken}`;

    hotelsUrl = appendQuery(base, {
      startDate: startDate,
      endDate: endDate,
      adults: String(passengers),
    });
  }

  /* -------------------- */
  /* Transfers — KiwiTaxi */
  /* -------------------- */
  // Paid: always use TP tracked short link if present.
  const transfersUrl =
    clean(cfg.kiwitaxiTracked) ||
    `https://www.google.com/search?q=${enc(cityName + " airport transfer")}`;

  /* -------------------- */
  /* Tickets — SportsEvents365 */
  /* -------------------- */
  // Paid: tracked base (later we can build team/fixture targeting).
  const ticketsUrl =
    clean(cfg.sportsevents365Tracked) ||
    `https://www.google.com/search?q=${enc(cityName + " football tickets")}`;

  /* -------------------- */
  /* Experiences — GetYourGuide */
  /* -------------------- */
  // Paid + robust: partner_id search URL.
  let experiencesUrl = `https://www.google.com/search?q=${enc(
    cityName + " things to do"
  )}`;

  const gygPartnerId = clean(cfg.getyourguidePartnerId);
  if (gygPartnerId && cityName) {
    experiencesUrl = `https://www.getyourguide.com/s/?q=${enc(
      cityName
    )}&partner_id=${enc(gygPartnerId)}`;
  }

  /* -------------------- */
  /* Maps */
  /* -------------------- */
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(
    cityName
  )}`;

  return {
    flightsUrl,
    hotelsUrl,
    transfersUrl,
    ticketsUrl,
    experiencesUrl,
    mapsUrl,
  };
}
