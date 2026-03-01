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
 * - Aviasales:
 *   - aviasalesTracked is your Travelpayouts short link fallback (always tracked).
 *   - aviasalesMarker enables true prefilled search URLs (recommended).
 * - Expedia:
 *   - expediaToken is the suffix token from expedia.com/affiliates/hotel-search-*.TOKEN links.
 * - GetYourGuide:
 *   - partner id is used in URL params for tracking.
 */
export const AffiliateConfig = {
  // Aviasales — tracking fallback (Travelpayouts short link)
  aviasalesTracked: "https://aviasales.tpm.lv/VYu40Vnv",

  // Aviasales — marker for prefilled search URL (set if you want full prefill + tracking)
  // If you're unsure, leave blank and we'll fall back to aviasalesTracked.
  aviasalesMarker: "700937",

  // Expedia Creator Program token extracted from your link
  // Example:
  // https://expedia.com/affiliates/hotel-search-dortmund.HQeXTbR
  expediaToken: "HQeXTbR",

  // KiwiTaxi (Travelpayouts short link)
  kiwitaxiTracked: "https://kiwitaxi.tpm.lv/oFUnzcw9",

  // Tickets (SportsEvents365)
  sportsevents365Tracked: "https://www.sportsevents365.com/?a_aid=69834e80ec9d3",

  // GetYourGuide (REAL partner ID)
  getyourguidePartnerId: "MAQJIREP",

  // Optional
  safetywingTracked: "",
  airhelpTracked: "",
} as const;

export const PARTNERS: Partner[] = [
  // Tickets
  {
    id: "sportsevents365",
    name: "SportsEvents365",
    category: "tickets",
    affiliate: true,
    api: true,
    deepLinkBase: "https://www.sportsevents365.com/",
  },

  // Flights
  {
    id: "aviasales",
    name: "Aviasales",
    category: "flights",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.aviasales.com/",
  },

  // Stays
  {
    id: "expedia",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.com/",
  },

  // Back-compat alias (older screens may still reference this id)
  {
    id: "expedia_stays",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.com/",
  },

  // Transfers
  {
    id: "kiwitaxi",
    name: "KiwiTaxi",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://kiwitaxi.com/",
  },

  // Experiences
  {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.getyourguide.com/",
  },

  // Insurance
  {
    id: "safetywing",
    name: "SafetyWing",
    category: "insurance",
    affiliate: true,
    api: false,
    deepLinkBase: "https://safetywing.com/",
  },

  // Compensation
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
