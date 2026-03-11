// src/core/partners.ts

export type PartnerCategory =
  | "tickets"
  | "flights"
  | "stays"
  | "transfers"
  | "experiences"
  | "insurance"
  | "compensation"
  | "utility";

export type Partner = {
  id: string;
  name: string;
  category: PartnerCategory;
  affiliate: boolean;
  api: boolean;
  deepLinkBase?: string;
};

export const PARTNERS: Partner[] = [
  // Utility (non-monetised)
  {
    id: "googlemaps",
    name: "Google Maps",
    category: "utility",
    affiliate: false,
    api: false,
    deepLinkBase: "https://www.google.com/maps",
  },

  // Tickets
  {
    id: "footballticketsnet",
    name: "FootballTicketNet",
    category: "tickets",
    affiliate: true,
    api: true,
    deepLinkBase: "https://www.footballticketnet.com/",
  },
  {
    id: "sportsevents365",
    name: "SportsEvents365",
    category: "tickets",
    affiliate: true,
    api: true,
    deepLinkBase: "https://www.sportsevents365.com/",
  },
  {
    id: "gigsberg",
    name: "Gigsberg",
    category: "tickets",
    affiliate: true,
    api: true,
    deepLinkBase: "https://www.gigsberg.com/",
  },
  {
    id: "seatpick",
    name: "SeatPick",
    category: "tickets",
    affiliate: true,
    api: false,
    deepLinkBase: "https://seatpick.com/",
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
    id: "expedia_stays",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.co.uk/",
  },
  {
    id: "expedia",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.co.uk/",
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
  {
    id: "welcomepickups",
    name: "Welcome Pickups",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.welcomepickups.com/",
  },

  // Experiences
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

  // Insurance
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

  // Compensation
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

export type PartnerId = (typeof PARTNERS)[number]["id"];

export function getPartnersByCategory(category: PartnerCategory): Partner[] {
  return PARTNERS.filter((p) => p.category === category);
}

export function getPartnerOrNull(id: string): Partner | null {
  return PARTNERS.find((p) => p.id === id) ?? null;
}

export function getPartner(id: PartnerId | string): Partner {
  const p = getPartnerOrNull(String(id));
  if (!p) throw new Error(`Unknown partner id: ${String(id)}`);
  return p;
}

export function isPartnerId(id: string): id is PartnerId {
  return PARTNERS.some((p) => p.id === id);
}
