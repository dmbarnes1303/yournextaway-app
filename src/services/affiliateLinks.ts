// src/services/affiliateLinks.ts

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

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

export function buildAffiliateLinks(args: {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;
}) {
  const cfg = AffiliateConfig ?? {};
  const city = clean(args.city);

  const startDate = ymdOrNull(args.startDate);
  const endDate = ymdOrNull(args.endDate);

  const origin = clean(args.originIata) || "LON";
  const dest = getIataCityCodeForCity(city);

  /* -------------------- */
  /* Flights — Aviasales  */
  /* -------------------- */
  let flightsUrl = `https://www.google.com/search?q=${enc(city + " flights")}`;

  if (dest && startDate) {
    const date = yyyymmdd(startDate);
    flightsUrl = `https://www.aviasales.com/search/${origin}${dest}${date}1?marker=495355`;
  }

  /* -------------------- */
  /* Hotels — Expedia     */
  /* -------------------- */
  let hotelsUrl = `https://www.google.com/search?q=${enc(city + " hotels")}`;

  if (cfg.expediaToken) {
    const slug = slugCity(city);
    hotelsUrl = `https://expedia.com/affiliates/hotel-search-${slug}.${cfg.expediaToken}`;
  }

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
    `https://www.sportsevents365.com/?a_aid=69834e80ec9d3`;

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
