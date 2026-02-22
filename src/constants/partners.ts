// src/constants/partners.ts

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
    deepLinkBase: "https://www.sportsevents365.com/",
  },
  {
    id: "seatpick",
    name: "SeatPick",
    category: "tickets",
    affiliate: true,
    api: false,
    deepLinkBase: "https://seatpick.com/",
  },

  // =====================
  // FLIGHTS
  // =====================
  {
    id: "expedia",
    name: "Expedia",
    category: "flights",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.com/",
  },
  {
    id: "aviasales",
    name: "AviaSales",
    category: "flights",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.aviasales.com/",
  },

  // =====================
  // STAYS
  // =====================
  {
    id: "expedia_stays",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.com/Hotels",
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
  {
    id: "welcomepickups",
    name: "Welcome Pickups",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.welcomepickups.com/",
  },
  {
    id: "klook_transfers",
    name: "Klook",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.klook.com/",
  },

  // =====================
  // EXPERIENCES
  // =====================
  {
    id: "tiqets",
    name: "Tiqets",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.tiqets.com/",
  },
  {
    id: "klook",
    name: "Klook",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.klook.com/",
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
    id: "wegotrip",
    name: "WeGoTrip",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://wegotrip.com/",
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
  {
    id: "ekta",
    name: "EKTA",
    category: "insurance",
    affiliate: true,
    api: false,
    deepLinkBase: "https://ektatraveling.com/",
  },

  // =====================
  // COMPENSATION
  // =====================
  {
    id: "airhelp",
    name: "AirHelp",
    category: "compensation",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.airhelp.com/",
  },
  {
    id: "compensair",
    name: "Compensair",
    category: "compensation",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.compensair.com/",
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

/**
 * Strict accessor: throws if partner id is unknown.
 * Use for "should never happen" code paths.
 */
export function getPartner(id: string): Partner {
  const p = getPartnerOrNull(id);
  if (!p) throw new Error(`Unknown partner id: ${id}`);
  return p;
}

export function isPartnerId(id: string): id is PartnerId {
  return PARTNERS.some((p) => p.id === id);
}
