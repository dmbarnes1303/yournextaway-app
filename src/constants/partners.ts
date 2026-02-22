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
    deepLinkBase: "https://www.sportsevents365.com/"
  },

  // SeatPick placeholder (pending approval)
  {
    id: "seatpick",
    name: "SeatPick",
    category: "tickets",
    affiliate: true,
    api: false,
    deepLinkBase: "https://seatpick.com/"
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
    deepLinkBase: "https://www.expedia.com/"
  },
  {
    id: "aviasales",
    name: "AviaSales",
    category: "flights",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.aviasales.com/"
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
    deepLinkBase: "https://www.expedia.com/Hotels"
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
    deepLinkBase: "https://kiwitaxi.com/"
  },
  {
    id: "welcomepickups",
    name: "Welcome Pickups",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.welcomepickups.com/"
  },
  {
    id: "klook_transfers",
    name: "Klook",
    category: "transfers",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.klook.com/"
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
    deepLinkBase: "https://www.tiqets.com/"
  },
  {
    id: "klook",
    name: "Klook",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.klook.com/"
  },
  {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.getyourguide.com/"
  },
  {
    id: "wegotrip",
    name: "WeGoTrip",
    category: "experiences",
    affiliate: true,
    api: false,
    deepLinkBase: "https://wegotrip.com/"
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
    deepLinkBase: "https://safetywing.com/"
  },
  {
    id: "ekta",
    name: "EKTA",
    category: "insurance",
    affiliate: true,
    api: false,
    deepLinkBase: "https://ektatraveling.com/"
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
    deepLinkBase: "https://www.airhelp.com/"
  },
  {
    id: "compensair",
    name: "Compensair",
    category: "compensation",
    affiliate: true,
    api: false,
    deepLinkBase: "https://www.compensair.com/"
  }
];
