// src/services/affiliateLinks.ts
// Centralised affiliate link builders + safe defaults.
// MUST NEVER crash the UI if partner config is missing.

import { getIataCityCodeForCity } from "@/src/constants/iataCities";
import { AffiliateConfig } from "@/src/constants/partners";
import { formatIsoToYmd } from "@/src/utils/dates";

type AffiliateCfg = {
  // Travelpayouts short links / tracked bases
  aviasalesTracked?: string;

  // Expedia affiliate token (from https://expedia.com/affiliates/hotel-search-<city>.<token>)
  expediaToken?: string;

  kiwitaxiTracked?: string;
  sportsevents365Tracked?: string;
  getyourguideTracked?: string;

  // optional future
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

function ymdOrNullFromAny(v: any): string | null {
  const s = clean(v);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  try {
    return formatIsoToYmd(s);
  } catch {
    return null;
  }
}

function slugCityForExpedia(cityName: string): string {
  // Expedia affiliate URLs expect a hyphen slug, typically lowercase.
  // This is intentionally simple + safe.
  return clean(cityName)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function withQuery(base: string, params: Record<string, string | null | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => clean(v).length > 0);
  if (!entries.length) return base;

  const hasQ = base.includes("?");
  const qs = entries.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&");
  return `${base}${hasQ ? "&" : "?"}${qs}`;
}

/**
 * Builds partner links with best-effort prefill.
 * - Always returns valid URLs.
 * - Uses tracked URLs when available.
 * - Attempts to prefill dates (start/end) whenever the partner supports query params.
 */
export function buildAffiliateLinks(args: {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;

  // Back-compat if any screens still pass these
  startDateIso?: string | null;
  endDateIso?: string | null;
}) {
  const cfg = safeObj<AffiliateCfg>((AffiliateConfig as any) ?? {});
  const cityName = clean(args.city) || "city";

  const startDate = ymdOrNullFromAny(args.startDate ?? args.startDateIso);
  const endDate = ymdOrNullFromAny(args.endDate ?? args.endDateIso);

  const originIata = clean(args.originIata) || "LON";
  const destIata = cityName ? getIataCityCodeForCity(cityName) : null;

  /* -------------------- */
  /* Flights — Aviasales  */
  /* -------------------- */
  // Reality check (brutal): your Travelpayouts short-link does NOT guarantee deep-link prefill.
  // We still try to add params, but if the redirect ignores them, you’ll land on Aviasales generic.
  // If you want perfect prefill + tracking, you need the real Aviasales MARKER-based deep link format.
  let flightsUrl = `https://www.google.com/search?q=${enc(`${cityName} flights ${startDate ?? ""} ${endDate ?? ""}`.trim())}`;

  if (clean(cfg.aviasalesTracked)) {
    flightsUrl = withQuery(clean(cfg.aviasalesTracked), {
      origin: destIata ? originIata : null,
      destination: destIata ?? null,
      depart_date: startDate,
      return_date: endDate,
      // keep a couple of common alternates (some redirectors ignore unknown params)
      from: destIata ? originIata : null,
      to: destIata ?? null,
      date1: startDate,
      date2: endDate,
    });
  }

  /* -------------------- */
  /* Hotels — Expedia     */
  /* -------------------- */
  // You DO have what we need: the affiliate token (e.g. HQeXTbR).
  // We generate: https://expedia.com/affiliates/hotel-search-<citySlug>.<token>
  // Then attempt to pass dates via common params.
  let hotelsUrl = `https://www.google.com/search?q=${enc(`${cityName} hotels ${startDate ?? ""} ${endDate ?? ""}`.trim())}`;

  const token = clean(cfg.expediaToken);
  if (token) {
    const slug = slugCityForExpedia(cityName);
    const base = `https://expedia.com/affiliates/hotel-search-${slug}.${token}`;

    // Expedia params are not perfectly consistent across surfaces;
    // we include several common ones for best chance of prefill.
    hotelsUrl = withQuery(base, {
      startDate,
      endDate,
      chkin: startDate,
      chkout: endDate,
      checkin: startDate,
      checkout: endDate,
    });
  }

  /* -------------------- */
  /* Transfers — KiwiTaxi */
  /* -------------------- */
  let transfersUrl = `https://www.google.com/search?q=${enc(`${cityName} airport transfer ${startDate ?? ""}`.trim())}`;

  if (clean(cfg.kiwitaxiTracked)) {
    transfersUrl = withQuery(clean(cfg.kiwitaxiTracked), {
      // KiwiTaxi/redirectors vary; still better than losing tracking.
      city: cityName,
      date: startDate,
      pickup_date: startDate,
      return_date: endDate,
    });
  }

  /* ---------------------------- */
  /* Tickets — SportsEvents365    */
  /* ---------------------------- */
  let ticketsUrl = `https://www.google.com/search?q=${enc(`${cityName} football tickets`)}`;

  if (clean(cfg.sportsevents365Tracked)) {
    // SportsEvents365 affiliate uses a_aid in your base URL.
    // We add a search hint; if they ignore it, tracking still works.
    ticketsUrl = withQuery(clean(cfg.sportsevents365Tracked), {
      q: `${cityName} tickets`,
      search: `${cityName} tickets`,
      date: startDate,
    });
  }

  /* ---------------------------- */
  /* Experiences — GetYourGuide   */
  /* ---------------------------- */
  let experiencesUrl = `https://www.google.com/search?q=${enc(`${cityName} things to do ${startDate ?? ""}`.trim())}`;

  if (clean(cfg.getyourguideTracked)) {
    experiencesUrl = withQuery(clean(cfg.getyourguideTracked), {
      q: cityName,
      date: startDate,
      startDate,
      endDate,
    });
  }

  /* -------------------- */
  /* Maps                 */
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
