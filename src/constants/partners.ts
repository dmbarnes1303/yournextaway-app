// src/constants/partners.ts
// Canonical affiliate registry WITH TRACKED BUILDERS
// Used by Trip + Smart Booking

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

/* ------------------------------------------------------------------ */
/* YOUR REAL AFFILIATE IDS                                            */
/* ------------------------------------------------------------------ */

export const AffiliateConfig = {
  aviasalesMarker: "700937",
  aviasalesFallback: "https://aviasales.tpm.lv/VYu40Vnv",

  expediaToken: "HQeXTbR",

  kiwitaxiTracked: "https://kiwitaxi.tpm.lv/oFUnzcw9",

  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=69834e80ec9d3",

  getyourguidePartnerId: "MAQJIREP",
} as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function enc(v: any) {
  return encodeURIComponent(String(v ?? "").trim());
}

function ymd(v?: string | null) {
  if (!v) return null;
  return String(v).slice(0, 10);
}

function slugCity(city: string) {
  return String(city)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/* ------------------------------------------------------------------ */
/* BUILDERS                                                           */
/* ------------------------------------------------------------------ */

function buildAviasales(ctx: AffiliateContext): string {
  if (!ctx.city) return AffiliateConfig.aviasalesFallback;

  const start = ymd(ctx.startDate);
  if (!start) return AffiliateConfig.aviasalesFallback;

  // NOTE: We don’t have IATA lookup here — fallback search works fine
  return `https://www.aviasales.com/search/${enc(ctx.city)}/${start}?marker=${AffiliateConfig.aviasalesMarker}`;
}

function buildExpedia(ctx: AffiliateContext): string | null {
  if (!ctx.city) return null;

  const slug = slugCity(ctx.city);
  const base = `https://expedia.com/affiliates/hotel-search-${slug}.${AffiliateConfig.expediaToken}`;

  const start = ymd(ctx.startDate);
  const end = ymd(ctx.endDate);

  if (!start || !end) return base;

  return `${base}?startDate=${start}&endDate=${end}`;
}

function buildKiwitaxi(): string {
  return AffiliateConfig.kiwitaxiTracked;
}

function buildGYG(ctx: AffiliateContext): string | null {
  if (!ctx.city) return null;
  return `https://www.getyourguide.com/s/?q=${enc(ctx.city)}&partner_id=${AffiliateConfig.getyourguidePartnerId}`;
}

function buildSE365(): string {
  return AffiliateConfig.sportsevents365Tracked;
}

/* ------------------------------------------------------------------ */
/* REGISTRY                                                           */
/* ------------------------------------------------------------------ */

export const PARTNERS: Partner[] = [
  {
    id: "aviasales",
    name: "Aviasales",
    category: "flights",
    affiliate: true,
    api: false,
    buildUrl: buildAviasales,
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
    buildUrl: buildGYG,
  },
  {
    id: "sportsevents365",
    name: "SportsEvents365",
    category: "tickets",
    affiliate: true,
    api: true,
    buildUrl: buildSE365,
  },
];

/* ------------------------------------------------------------------ */
/* HELPERS                                                            */
/* ------------------------------------------------------------------ */

export type PartnerId = (typeof PARTNERS)[number]["id"];

export function getPartner(id: PartnerId): Partner {
  const p = PARTNERS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown partner ${id}`);
  return p;
}

export function buildPartnerUrl(
  id: PartnerId,
  ctx: AffiliateContext
): string | null {
  try {
    return getPartner(id).buildUrl(ctx);
  } catch {
    return null;
  }
}
