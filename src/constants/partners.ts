// src/constants/partners.ts
// Canonical partner registry + affiliate link config.
// This file MUST export AffiliateConfig for src/services/affiliateLinks.ts.

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
 * Put your real tracking values in here.
 *
 * If these are empty, the app will still open the partner site,
 * but you may NOT get paid if the program requires tags on every link.
 */
export const AffiliateConfig = {
  // Flights (Aviasales)
  // Example marker: "123456" (whatever Aviasales gives you)
  aviasalesMarker: "",

  // Expedia
  // Put your tracked landing URL (with affcid/utm/etc) if you have one.
  // If you don't, leave blank and the app uses normal Expedia URLs.
  expediaStaysTracked: "",
  expediaCarsTracked: "",

  // GetYourGuide
  // Some programs use partner_id or similar; store a full tracked base URL.
  getyourguideTracked: "",

  // KiwiTaxi
  kiwitaxiTracked: "",

  // SportsEvents365
  sportsevents365Tracked: "",

  // Insurance / Claims
  safetywingTracked: "",
  airhelpTracked: "",
} as const;

export const PARTNERS: Partner[] = [
  // =====================
  // TICKETS
  // =====================
  {
    id: "sportsevents365",
    name: "SportsEvents365",
    category: "tickets",
    affiliate: true,
    api: true,
    // keep generic base; tracked base goes in AffiliateConfig if required
    deepLinkBase: "https://www.sportsevents365.com/",
  },

  // =====================
  // FLIGHTS
  // =====================
  {
    id: "aviasales",
    name: "Aviasales",
    category: "flights",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.aviasales.com/",
  },

  // =====================
  // STAYS (Hotels)
  // =====================
  {
    id: "expedia",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.co.uk/",
  },

  // =====================
  // TRANSFERS
  // =====================
  {
    id: "kiwitaxi",
    name: "KiwiTaxi",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://kiwitaxi.com/",
  },

  // =====================
  // EXPERIENCES (Activities)
  // =====================
  {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.getyourguide.com/",
  },

  // =====================
  // INSURANCE
  // =====================
  {
    id: "safetywing",
    name: "SafetyWing",
    category: "insurance",
    affiliate: true,
    api: false,
    deepLinkBase: "https://safetywing.com/",
  },

  // =====================
  // COMPENSATION (Claims)
  // =====================
  {
    id: "airhelp",
    name: "AirHelp",
    category: "compensation",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.airhelp.com/",
  },
];

// --------- selectors / helpers ---------

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
