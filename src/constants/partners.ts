// src/constants/partners.ts
// Canonical partner registry WITH TRACKED BUILDERS

export type PartnerCategory =
  | "tickets"
  | "flights"
  | "stays"
  | "transfers"
  | "experiences"
  | "insurance"
  | "compensation";

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
  buildUrl?: (ctx: AffiliateContext) => string | null;
};

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
/* Affiliate IDs — YOUR REAL VALUES                                   */
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
/* Builders                                                           */
/* ------------------------------------------------------------------ */

function buildAviasales(ctx: AffiliateContext): string | null {
  const city = ctx.city;
  const start = ymd(ctx.startDate);
  const origin = ctx.originIata || "LON";

  if (!city || !start) return AffiliateConfig.aviasalesFallback;

  // destination unknown → fallback
  const dest = city.slice(0, 3).toUpperCase();

  return `https://www.aviasales.com/search/${origin}${dest}${start.replace(
    /-/g,
    ""
  )}1?marker=${AffiliateConfig.aviasalesMarker}`;
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

function buildKiwitaxi(ctx: AffiliateContext): string | null {
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
/* Registry                                                           */
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
    buildUrl: () => buildSE365(),
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
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
  const p = getPartner(id);
  if (!p.buildUrl) return null;
  try {
    return p.buildUrl(ctx);
  } catch {
    return null;
  }
}
