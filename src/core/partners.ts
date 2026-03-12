// src/core/partners.ts

export type PartnerCategory =
  | "tickets"
  | "flights"
  | "rail"
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
  canonicalId?: string;
};

export const PARTNERS: Partner[] = [
  {
    id: "googlemaps",
    name: "Google Maps",
    category: "utility",
    affiliate: false,
    api: false,
    deepLinkBase: "https://www.google.com/maps",
    canonicalId: "googlemaps",
  },

  {
    id: "footballticketsnet",
    name: "FootballTicketNet",
    category: "tickets",
    affiliate: true,
    api: true,
    deepLinkBase: "https://www.footballticketnet.com/",
    canonicalId: "footballticketsnet",
  },
  {
    id: "sportsevents365",
    name: "SportsEvents365",
    category: "tickets",
    affiliate: true,
    api: true,
    deepLinkBase: "https://www.sportsevents365.com/",
    canonicalId: "sportsevents365",
  },
  {
    id: "gigsberg",
    name: "Gigsberg",
    category: "tickets",
    affiliate: true,
    api: true,
    deepLinkBase: "https://www.gigsberg.com/",
    canonicalId: "gigsberg",
  },
  {
    id: "seatpick",
    name: "SeatPick",
    category: "tickets",
    affiliate: true,
    api: false,
    deepLinkBase: "https://seatpick.com/",
    canonicalId: "seatpick",
  },

  {
    id: "aviasales",
    name: "Aviasales",
    category: "flights",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.aviasales.com/",
    canonicalId: "aviasales",
  },

  {
    id: "omio",
    name: "Omio",
    category: "rail",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.omio.com/",
    canonicalId: "omio",
  },

  {
    id: "expedia",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.co.uk/",
    canonicalId: "expedia",
  },
  {
    id: "expedia_stays",
    name: "Expedia",
    category: "stays",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.expedia.co.uk/",
    canonicalId: "expedia",
  },

  {
    id: "kiwitaxi",
    name: "KiwiTaxi",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://kiwitaxi.com/",
    canonicalId: "kiwitaxi",
  },
  {
    id: "welcomepickups",
    name: "Welcome Pickups",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.welcomepickups.com/",
    canonicalId: "welcomepickups",
  },

  {
    id: "tiqets",
    name: "Tiqets",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.tiqets.com/",
    canonicalId: "tiqets",
  },
  {
    id: "klook",
    name: "Klook",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.klook.com/",
    canonicalId: "klook",
  },
  {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.getyourguide.com/",
    canonicalId: "getyourguide",
  },
  {
    id: "wegotrip",
    name: "WeGoTrip",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://wegotrip.com/",
    canonicalId: "wegotrip",
  },

  {
    id: "safetywing",
    name: "SafetyWing",
    category: "insurance",
    affiliate: true,
    api: false,
    deepLinkBase: "https://safetywing.com/",
    canonicalId: "safetywing",
  },
  {
    id: "ekta",
    name: "EKTA",
    category: "insurance",
    affiliate: true,
    api: false,
    deepLinkBase: "https://ektatraveling.com/",
    canonicalId: "ekta",
  },

  {
    id: "airhelp",
    name: "AirHelp",
    category: "compensation",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.airhelp.com/",
    canonicalId: "airhelp",
  },
  {
    id: "compensair",
    name: "Compensair",
    category: "compensation",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.compensair.com/",
    canonicalId: "compensair",
  },
];

export type PartnerId = (typeof PARTNERS)[number]["id"];

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

export function getPartnersByCategory(category: PartnerCategory): Partner[] {
  return PARTNERS.filter((p) => p.category === category);
}

export function getPartnerOrNull(id: string): Partner | null {
  const raw = clean(id);
  if (!raw) return null;
  return PARTNERS.find((p) => p.id === raw) ?? null;
}

export function getPartner(id: PartnerId | string): Partner {
  const p = getPartnerOrNull(String(id));
  if (!p) throw new Error(`Unknown partner id: ${String(id)}`);
  return p;
}

export function isPartnerId(id: string): id is PartnerId {
  return PARTNERS.some((p) => p.id === id);
}

export function getCanonicalPartnerId(id: PartnerId | string): string {
  const partner = getPartner(id);
  return clean(partner.canonicalId) || partner.id;
}

export function isSamePartner(a?: string | null, b?: string | null): boolean {
  if (!clean(a) || !clean(b)) return false;
  return getCanonicalPartnerId(clean(a)) === getCanonicalPartnerId(clean(b));
}
