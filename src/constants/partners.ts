// src/constants/partners.ts
// Canonical partner registry + affiliate config for affiliateLinks.ts

export type PartnerCategory =
  | "tickets"
  | "flights"
  | "stays"
  | "transfers"
  | "experiences"
  | "insurance"
  | "compensation";

export type Partner = {
  id: string;
  name: string;
  category: PartnerCategory;
  affiliate: boolean;
  api: boolean;
  deepLinkBase?: string;
};

/**
 * AffiliateConfig
 * REAL TRACKED VALUES — DO NOT REMOVE
 *
 * Notes:
 * - Aviasales: keep Travelpayouts short link for tracking fallback.
 * - Expedia: expediaToken is the suffix token from your
 *   expedia.com/affiliates/hotel-search-<slug>.<TOKEN> links.
 * - GetYourGuide: partner id used as query param in affiliateLinks.ts.
 */
export const AffiliateConfig = {
  // Aviasales
  aviasalesTracked: "https://aviasales.tpm.lv/VYu40Vnv",

  // Expedia
  expediaToken: "HQeXTbR",

  // KiwiTaxi
  kiwitaxiTracked: "https://kiwitaxi.tpm.lv/oFUnzcw9",

  // SportsEvents365
  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=69834e80ec9d3",

  // GetYourGuide (REAL ID)
  getyourguidePartnerId: "MAQJIREP",

  // Optional
  safetywingTracked: "",
  airhelpTracked: "",
} as const;

export const PARTNERS: Partner[] = [
  {
    id: "sportsevents365",
    name: "SportsEvents365",
    category: "tickets",
    affiliate: true,
    api: true,
    deepLinkBase: "https://www.sportsevents365.com/",
  },
  {
    id: "aviasales",
    name: "Aviasales",
    category: "flights",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.aviasales.com/",
  },
  {
    id: "expedia",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.com/",
  },
  {
    id: "kiwitaxi",
    name: "KiwiTaxi",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://kiwitaxi.com/",
  },
  {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.getyourguide.com/",
  },
  {
    id: "safetywing",
    name: "SafetyWing",
    category: "insurance",
    affiliate: true,
    api: false,
    deepLinkBase: "https://safetywing.com/",
  },
  {
    id: "airhelp",
    name: "AirHelp",
    category: "compensation",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.airhelp.com/",
  },
];

// helpers
export type PartnerId = (typeof PARTNERS)[number]["id"];

export function getPartnersByCategory(category: PartnerCategory): Partner[] {
  return PARTNERS.filter((p) => p.category === category);
}

export function getPartnerOrNull(id: string): Partner | null {
  return PARTNERS.find((p) => p.id === id) ?? null;
}

export function getPartner(id: string): Partner {
  const p = getPartnerOrNull(id);
  if (!p) throw new Error(`Unknown partner id: ${id}`);
  return p;
}

export function isPartnerId(id: string): id is PartnerId {
  return PARTNERS.some((p) => p.id === id);
}
