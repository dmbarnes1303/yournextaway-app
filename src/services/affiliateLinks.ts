// src/services/affiliateLinks.ts
// Centralised affiliate link builders.
// MUST NEVER crash the UI. Always return safe URLs.

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

function normalizeCabin(v: any): CabinClass {
  const s = clean(v).toLowerCase();
  if (s === "premium" || s === "premiumeconomy" || s === "premium-economy") return "premium";
  if (s === "business") return "business";
  if (s === "first") return "first";
  return "economy";
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

  // enhancements
  passengers?: number | null; // total passengers (1–9)
  cabinClass?: CabinClass | string | null;
}) {
  const cfg = (AffiliateConfig ?? {}) as any;

  const city = clean(args.city);
  const startDate = ymdOrNull(args.startDate);
  const endDate = ymdOrNull(args.endDate);

  const origin = clean(args.originIata) || "LON";
  const dest = getIataCityCodeForCity(city);

  const passengers = clampInt(args.passengers, 1, 9, 1);
  const cabinClass = normalizeCabin(args.cabinClass);

  /* -------------------- */
  /* Flights — Aviasales  */
  /* -------------------- */
  // True prefill: build an Aviasales search URL (origin/dest/date).
  // Return date: auto from trip end date when provided.
  // Passengers + cabin: best-effort query params (safe if ignored).
  let flightsUrl = `https://www.google.com/search?q=${enc(city + " flights")}`;

  if (dest && startDate) {
    const out = yyyymmdd(startDate);
    const ret = yyyymmdd(endDate); // auto-return from trip end

    // NOTE: Aviasales markers are normally numeric (Travelpayouts).
    // If you later want to use a marker value, add it to AffiliateConfig and swap here.
    const base = `https://www.aviasales.com/search/${enc(origin)}${enc(dest)}${enc(out)}1`;

    const params: string[] = [];
    // tracking fallback: if you only have a short link, we still prefill via aviasales.com (better UX)
    // If you add a real marker later, append marker=... here.
    if (ret) params.push(`return_date=${enc(ret)}`);
    if (passengers !== 1) params.push(`adults=${enc(passengers)}`);
    if (cabinClass !== "economy") params.push(`cabin=${enc(cabinClass)}`);

    flightsUrl = params.length ? `${base}?${params.join("&")}` : base;
  } else if (cfg.aviasalesTracked) {
    // fallback tracked link if we can't prefill
    flightsUrl = String(cfg.aviasalesTracked);
  }

  /* -------------------- */
  /* Hotels — Expedia     */
  /* -------------------- */
  // Primary: stable Expedia affiliates token link for the city.
  // Dates: append best-effort params (some flows ignore them; safe either way).
  let hotelsUrl = `https://www.google.com/search?q=${enc(city + " hotels")}`;

  if (cfg.expediaToken) {
    const slug = slugCity(city);
    hotelsUrl = `https://expedia.com/affiliates/hotel-search-${slug}.${String(cfg.expediaToken)}`;

    const hotelParams: string[] = [];
    if (startDate) hotelParams.push(`startDate=${enc(startDate)}`);
    if (endDate) hotelParams.push(`endDate=${enc(endDate)}`);

    if (hotelParams.length) hotelsUrl = `${hotelsUrl}?${hotelParams.join("&")}`;
  }

  /* -------------------- */
  /* Transfers — KiwiTaxi */
  /* -------------------- */
  const transfersUrl =
    cfg.kiwitaxiTracked
      ? String(cfg.kiwitaxiTracked)
      : `https://www.google.com/search?q=${enc(city + " airport transfer")}`;

  /* -------------------- */
  /* Tickets — SportsEvents365 */
  /* -------------------- */
  const ticketsUrl =
    cfg.sportsevents365Tracked
      ? String(cfg.sportsevents365Tracked)
      : `https://www.google.com/search?q=${enc(city + " football tickets")}`;

  /* -------------------- */
  /* Experiences — GetYourGuide */
  /* -------------------- */
  // Use partner id to ensure attribution.
  // This is a safe search-style link; if GYG changes params later, it will still open.
  let experiencesUrl = `https://www.google.com/search?q=${enc(city + " things to do")}`;

  if (cfg.getyourguidePartnerId) {
    // Keep it simple + robust: partner_id + query
    experiencesUrl = `https://www.getyourguide.com/s/?q=${enc(city)}&partner_id=${enc(
      String(cfg.getyourguidePartnerId)
    )}`;
  }

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
