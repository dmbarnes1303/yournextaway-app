// src/constants/partners.ts
// Affiliate configuration + lightweight tracked partner registry.
// Used by Trip, Match and Smart Booking flows for safe fallback link building.
//
// IMPORTANT:
// This is NOT the full app-wide canonical partner identity model.
// That lives in src/core/partners.ts.
// This file should stay focused on affiliate config + fallback URL builders only.

export type PartnerCategory =
  | "tickets"
  | "flights"
  | "stays"
  | "transfers"
  | "experiences";

export type AffiliateContext = {
  city: string;
  startDate?: string | null;
  endDate?: string | null;
  originIata?: string | null;
};

export type Partner = {
  id: string;
  name: string;
  category: PartnerCategory;
  affiliate: boolean;
  api: boolean;
  buildUrl: (ctx: AffiliateContext) => string | null;
};

/* -------------------------------------------------------------------------- */
/* Affiliate config                                                            */
/* -------------------------------------------------------------------------- */

export const AffiliateConfig = {
  aviasalesMarker: "700937",
  aviasalesFallback: "https://aviasales.tpm.lv/VYu40Vnv",

  expediaToken: "HQeXTbR",

  kiwitaxiTracked: "https://kiwitaxi.tpm.lv/oFUnzcw9",

  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=69834e80ec9d3",

  getyourguidePartnerId: "MAQJIREP",
} as const;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function enc(value: unknown): string {
  return encodeURIComponent(clean(value));
}

function ymd(value?: string | null): string | null {
  const raw = clean(value);
  if (!raw) return null;
  return raw.slice(0, 10);
}

function slugCity(city: string): string {
  return clean(city)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${enc(query)}`;
}

function appendQuery(
  base: string,
  params: Record<string, string | null | undefined>
): string | null {
  const safeBase = clean(base);
  if (!safeBase) return null;

  const entries = Object.entries(params).filter(([, v]) => clean(v));
  if (!entries.length) return safeBase;

  const joiner = safeBase.includes("?") ? "&" : "?";
  const qs = entries.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&");
  return `${safeBase}${joiner}${qs}`;
}

/* -------------------------------------------------------------------------- */
/* Fallback builders                                                           */
/* -------------------------------------------------------------------------- */

function buildAviasales(ctx: AffiliateContext): string {
  const fallback = clean(AffiliateConfig.aviasalesFallback);
  const city = clean(ctx.city);
  const start = ymd(ctx.startDate);

  // This registry intentionally does NOT do full route-prefill logic.
  // That belongs in src/services/affiliateLinks.ts.
  if (!city || !start) {
    return fallback || googleSearchUrl(`${city || "travel"} flights`);
  }

  if (fallback) return fallback;

  return googleSearchUrl(`${city} flights`);
}

function buildExpedia(ctx: AffiliateContext): string | null {
  const city = clean(ctx.city);
  const token = clean(AffiliateConfig.expediaToken);

  if (!city) return googleSearchUrl("hotels");
  if (!token) return googleSearchUrl(`${city} hotels`);

  const slug = slugCity(city);
  const base = `https://expedia.com/affiliates/hotel-search-${slug}.${token}`;

  return appendQuery(base, {
    startDate: ymd(ctx.startDate),
    endDate: ymd(ctx.endDate),
  });
}

function buildKiwitaxi(ctx: AffiliateContext): string {
  const tracked = clean(AffiliateConfig.kiwitaxiTracked);
  if (tracked) return tracked;

  return googleSearchUrl(`${clean(ctx.city)} airport transfer`);
}

function buildGetYourGuide(ctx: AffiliateContext): string {
  const city = clean(ctx.city);
  const partnerId = clean(AffiliateConfig.getyourguidePartnerId);

  if (!city) return googleSearchUrl("things to do");
  if (!partnerId) return googleSearchUrl(`${city} things to do`);

  return `https://www.getyourguide.com/s/?q=${enc(city)}&partner_id=${enc(partnerId)}`;
}

function buildSportsEvents365(_ctx: AffiliateContext): string {
  return clean(AffiliateConfig.sportsevents365Tracked) || "https://www.sportsevents365.com/";
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                    */
/* -------------------------------------------------------------------------- */

export const PARTNERS = [
  {
    id: "aviasales",
    name: "Aviasales",
    category: "flights",
    affiliate: true,
    api: false,
    buildUrl: buildAviasales,
  },
  {
    id: "expedia",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    buildUrl: buildExpedia,
  },
  {
    id: "expedia_stays",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    buildUrl: buildExpedia,
  },
  {
    id: "kiwitaxi",
    name: "KiwiTaxi",
    category: "transfers",
    affiliate: true,
    api: false,
    buildUrl: buildKiwitaxi,
  },
  {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "experiences",
    affiliate: true,
    api: false,
    buildUrl: buildGetYourGuide,
  },
  {
    id: "sportsevents365",
    name: "SportsEvents365",
    category: "tickets",
    affiliate: true,
    api: true,
    buildUrl: buildSportsEvents365,
  },
] as const satisfies readonly Partner[];

/* -------------------------------------------------------------------------- */
/* Lookup helpers                                                              */
/* -------------------------------------------------------------------------- */

export type PartnerId = (typeof PARTNERS)[number]["id"];

const PARTNER_MAP: Record<string, Partner> = Object.fromEntries(
  PARTNERS.map((partner) => [partner.id, partner])
);

export function getPartner(id: PartnerId | string): Partner {
  const key = clean(id);
  const partner = PARTNER_MAP[key];

  if (!partner) {
    throw new Error(`Unknown partner ${key}`);
  }

  return partner;
}

export function getPartnerOrNull(id: string | null | undefined): Partner | null {
  const key = clean(id);
  if (!key) return null;
  return PARTNER_MAP[key] ?? null;
}

export function buildPartnerUrl(
  id: PartnerId | string,
  ctx: AffiliateContext
): string | null {
  try {
    return getPartner(id).buildUrl(ctx);
  } catch {
    return null;
  }
}
