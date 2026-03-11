// src/constants/partners.ts
// Canonical affiliate registry with tracked builders.
// Used by Trip, Match and Smart Booking flows.

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
/* YOUR AFFILIATE CONFIG                                              */
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

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function enc(v: unknown) {
  return encodeURIComponent(clean(v));
}

function ymd(v?: string | null) {
  const value = clean(v);
  if (!value) return null;
  return value.slice(0, 10);
}

function slugCity(city: string) {
  return clean(city)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function googleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${enc(query)}`;
}

function appendQuery(
  base: string,
  params: Record<string, string | null | undefined>
) {
  const safeBase = clean(base);
  if (!safeBase) return null;

  const entries = Object.entries(params).filter(([, v]) => clean(v));
  if (!entries.length) return safeBase;

  const joiner = safeBase.includes("?") ? "&" : "?";
  const qs = entries.map(([k, v]) => `${enc(k)}=${enc(v)}`).join("&");
  return `${safeBase}${joiner}${qs}`;
}

/* ------------------------------------------------------------------ */
/* BUILDERS                                                           */
/* ------------------------------------------------------------------ */

function buildAviasales(ctx: AffiliateContext): string {
  const fallback = clean(AffiliateConfig.aviasalesFallback);
  const city = clean(ctx.city);
  const start = ymd(ctx.startDate);

  if (!city || !start) {
    return fallback || googleSearchUrl(`${city || "travel"} flights`);
  }

  // This is intentionally a safe fallback builder.
  // Real prefilled route building is handled in services/affiliateLinks.ts.
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

function buildGYG(ctx: AffiliateContext): string | null {
  const city = clean(ctx.city);
  const partnerId = clean(AffiliateConfig.getyourguidePartnerId);

  if (!city) return googleSearchUrl("things to do");
  if (!partnerId) return googleSearchUrl(`${city} things to do`);

  return `https://www.getyourguide.com/s/?q=${enc(city)}&partner_id=${enc(partnerId)}`;
}

function buildSE365(): string {
  return clean(AffiliateConfig.sportsevents365Tracked) || "https://www.sportsevents365.com/";
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
  const partner = PARTNERS.find((x) => x.id === id);
  if (!partner) throw new Error(`Unknown partner ${id}`);
  return partner;
}

export function buildPartnerUrl(id: PartnerId, ctx: AffiliateContext): string | null {
  try {
    return getPartner(id).buildUrl(ctx);
  } catch {
    return null;
  }
}
