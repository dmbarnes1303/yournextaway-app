// src/services/affiliateLinks.ts
// Centralised affiliate link builders + safe defaults.
// MUST NEVER crash the UI if partner config is missing.

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

type AffiliateCfg = {
  // Travelpayouts tracked bases
  aviasalesTracked?: string;
  kiwitaxiTracked?: string;
  tiqetsTracked?: string;
  klookTracked?: string;

  // Direct tracked bases
  expediaTracked?: string;
  sportsevents365Tracked?: string;

  // Optional future tracked bases
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

/**
 * Builds partner links with best-effort prefill.
 * Contract: return keys used by Trip workspace.
 */
export function buildAffiliateLinks(args: {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;
}) {
  const cfg = safeObj<AffiliateCfg>((AffiliateConfig as any) ?? {});
  const city = clean(args.city).toLowerCase().replace(/\s+/g, "-");

  const startDate = ymdOrNullFromAny(args.startDate);
  const endDate = ymdOrNullFromAny(args.endDate);

  const originIata = clean(args.originIata) || "LON";
  const destIata = getIataCityCodeForCity(args.city);

  // NOTE: originIata/endDate currently not used in the tracked base URLs below,
  // but kept because you'll likely expand prefill later.
  void originIata;
  void endDate;

  /* Flights — Aviasales */
  const flightsUrl =
    cfg.aviasalesTracked && destIata && startDate
      ? `${cfg.aviasalesTracked}`
      : `https://www.google.com/search?q=${enc(args.city + " flights")}`;

  /* Hotels — Expedia */
  let hotelsUrl = `https://www.google.com/search?q=${enc(args.city + " hotels")}`;

  if (cfg.expediaTracked) {
    const tokenMatch = cfg.expediaTracked.match(/hotel-search-[^.]+\.(.+)$/);
    const token = tokenMatch?.[1];
    if (token) {
      hotelsUrl = `https://expedia.com/affiliates/hotel-search-${city}.${token}`;
    }
  }

  /* Transfers — KiwiTaxi */
  const transfersUrl =
    cfg.kiwitaxiTracked ||
    `https://www.google.com/search?q=${enc(args.city + " airport transfer")}`;

  /* Tickets — SportsEvents365 */
  const ticketsUrl =
    cfg.sportsevents365Tracked ||
    `https://www.google.com/search?q=${enc(args.city + " football tickets")}`;

  /* Experiences — Tiqets / Klook */
  const experiencesUrl =
    cfg.tiqetsTracked ||
    cfg.klookTracked ||
    `https://www.google.com/search?q=${enc(args.city + " things to do")}`;

  /* Maps */
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${enc(args.city)}`;

  return {
    flightsUrl,
    hotelsUrl,
    transfersUrl,
    ticketsUrl,
    experiencesUrl,
    mapsUrl,
  };
}
