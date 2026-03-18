// src/constants/partners.ts
// Affiliate configuration + lightweight tracked partner registry.
// This file is intentionally limited to:
// 1) tracked config values
// 2) lightweight registry metadata
// 3) simple safe partner URL builders
//
// Canonical partner identity / aliases live elsewhere.
// This file should not pretend Google search is a real affiliate layer.

export type PartnerCategory =
  | "tickets"
  | "flights"
  | "stays"
  | "transfers"
  | "experiences"
  | "transport"
  | "insurance"
  | "claims";

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
  live: boolean;
  buildUrl: (ctx: AffiliateContext) => string | null;
};

export const AffiliateConfig = {
  aviasalesMarker: "700937",
  aviasalesFallback: "https://aviasales.tpm.lv/VYu40Vnv",

  expediaToken: "HQeXTbR",

  kiwitaxiTracked: "https://kiwitaxi.tpm.lv/oFUnzcw9",

  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=69834e80ec9d3",

  getyourguidePartnerId: "MAQJIREP",

  omioTracked: "https://omio.sjv.io/KBjDon",

  // SafetyWing removed from active config until a real tracked setup exists.
  ektaTracked: "",
  klookTracked: "",
  tiqetsTracked: "",
  wegotripTracked: "",
  airhelpTracked: "",
  compensairTracked: "",
  welcomepickupsTracked: "",
} as const;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
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

function safeTrackedUrl(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
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

function hasTrackedConfig(key: keyof typeof AffiliateConfig): boolean {
  return !!safeTrackedUrl(AffiliateConfig[key]);
}

/* -------------------------------------------------------------------------- */
/* Lightweight builders                                                       */
/* -------------------------------------------------------------------------- */

function buildAviasales(ctx: AffiliateContext): string | null {
  const fallback = safeTrackedUrl(AffiliateConfig.aviasalesFallback);
  if (!fallback) return null;

  const city = clean(ctx.city);
  const start = ymd(ctx.startDate);

  if (!city || !start) return fallback;

  return appendQuery(fallback, {
    destination: city,
    departureDate: start,
    returnDate: ymd(ctx.endDate),
    origin: clean(ctx.originIata) || null,
  });
}

function buildExpedia(ctx: AffiliateContext): string | null {
  const city = clean(ctx.city);
  const token = clean(AffiliateConfig.expediaToken);

  if (!city || !token) return null;

  const slug = slugCity(city);
  const base = `https://expedia.com/affiliates/hotel-search-${slug}.${token}`;

  return appendQuery(base, {
    startDate: ymd(ctx.startDate),
    endDate: ymd(ctx.endDate),
  });
}

function buildKiwitaxi(ctx: AffiliateContext): string | null {
  const tracked = safeTrackedUrl(AffiliateConfig.kiwitaxiTracked);
  if (!tracked) return null;

  return appendQuery(tracked, {
    to: clean(ctx.city) || null,
    destination: clean(ctx.city) || null,
    date: ymd(ctx.startDate),
  });
}

function buildGetYourGuide(ctx: AffiliateContext): string | null {
  const city = clean(ctx.city);
  const partnerId = clean(AffiliateConfig.getyourguidePartnerId);

  if (!city || !partnerId) return null;

  return `https://www.getyourguide.com/s/?q=${enc(city)}&partner_id=${enc(partnerId)}`;
}

function buildSportsEvents365(ctx: AffiliateContext): string | null {
  const tracked = safeTrackedUrl(AffiliateConfig.sportsevents365Tracked);
  if (!tracked) return null;

  return appendQuery(tracked, {
    q: clean(ctx.city) || null,
    city: clean(ctx.city) || null,
    from: ymd(ctx.startDate),
    to: ymd(ctx.endDate),
  });
}

function buildOmio(ctx: AffiliateContext): string | null {
  const tracked = safeTrackedUrl(AffiliateConfig.omioTracked);
  if (!tracked) return null;

  return appendQuery(tracked, {
    destination: clean(ctx.city) || null,
    destination_name: clean(ctx.city) || null,
    outboundDate: ymd(ctx.startDate),
    departureDate: ymd(ctx.startDate),
    inboundDate: ymd(ctx.endDate),
    returnDate: ymd(ctx.endDate),
  });
}

function buildTrackedOnly(key: keyof typeof AffiliateConfig) {
  return function buildTrackedPartner(_ctx: AffiliateContext): string | null {
    return safeTrackedUrl(AffiliateConfig[key]);
  };
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

export const PARTNERS = [
  {
    id: "aviasales",
    name: "Aviasales",
    category: "flights",
    affiliate: true,
    api: false,
    live: true,
    buildUrl: buildAviasales,
  },
  {
    id: "expedia",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    live: true,
    buildUrl: buildExpedia,
  },
  {
    id: "kiwitaxi",
    name: "KiwiTaxi",
    category: "transfers",
    affiliate: true,
    api: false,
    live: true,
    buildUrl: buildKiwitaxi,
  },
  {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "experiences",
    affiliate: true,
    api: false,
    live: true,
    buildUrl: buildGetYourGuide,
  },
  {
    id: "sportsevents365",
    name: "SportsEvents365",
    category: "tickets",
    affiliate: true,
    api: true,
    live: true,
    buildUrl: buildSportsEvents365,
  },
  {
    id: "omio",
    name: "Omio",
    category: "transport",
    affiliate: true,
    api: false,
    live: true,
    buildUrl: buildOmio,
  },
  {
    id: "ekta",
    name: "EKTA",
    category: "insurance",
    affiliate: hasTrackedConfig("ektaTracked"),
    api: false,
    live: hasTrackedConfig("ektaTracked"),
    buildUrl: buildTrackedOnly("ektaTracked"),
  },
  {
    id: "klook",
    name: "Klook",
    category: "experiences",
    affiliate: hasTrackedConfig("klookTracked"),
    api: false,
    live: hasTrackedConfig("klookTracked"),
    buildUrl: buildTrackedOnly("klookTracked"),
  },
  {
    id: "tiqets",
    name: "Tiqets",
    category: "experiences",
    affiliate: hasTrackedConfig("tiqetsTracked"),
    api: false,
    live: hasTrackedConfig("tiqetsTracked"),
    buildUrl: buildTrackedOnly("tiqetsTracked"),
  },
  {
    id: "wegotrip",
    name: "WeGoTrip",
    category: "experiences",
    affiliate: hasTrackedConfig("wegotripTracked"),
    api: false,
    live: hasTrackedConfig("wegotripTracked"),
    buildUrl: buildTrackedOnly("wegotripTracked"),
  },
  {
    id: "airhelp",
    name: "AirHelp",
    category: "claims",
    affiliate: hasTrackedConfig("airhelpTracked"),
    api: false,
    live: hasTrackedConfig("airhelpTracked"),
    buildUrl: buildTrackedOnly("airhelpTracked"),
  },
  {
    id: "compensair",
    name: "Compensair",
    category: "claims",
    affiliate: hasTrackedConfig("compensairTracked"),
    api: false,
    live: hasTrackedConfig("compensairTracked"),
    buildUrl: buildTrackedOnly("compensairTracked"),
  },
  {
    id: "welcomepickups",
    name: "Welcome Pickups",
    category: "transfers",
    affiliate: hasTrackedConfig("welcomepickupsTracked"),
    api: false,
    live: hasTrackedConfig("welcomepickupsTracked"),
    buildUrl: buildTrackedOnly("welcomepickupsTracked"),
  },
] as const satisfies readonly Partner[];

/* -------------------------------------------------------------------------- */
/* Lookup helpers                                                             */
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

export function getLivePartners(): Partner[] {
  return PARTNERS.filter((partner) => partner.live);
}

export function buildPartnerUrl(
  id: PartnerId | string,
  ctx: AffiliateContext
): string | null {
  try {
    const partner = getPartner(id);
    if (!partner.live) return null;
    return partner.buildUrl(ctx);
  } catch {
    return null;
  }
    }
