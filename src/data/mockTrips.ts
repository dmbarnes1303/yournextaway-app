// src/data/mockTrips.ts

import type { PartnerId, PartnerCategory } from "@/src/constants/partners";

export type SavedItemStatus = "saved" | "pending" | "booked";

export type SavedItem = {
  id: string;
  category: Exclude<PartnerCategory, "compensation"> | "compensation";
  title: string;
  subtitle?: string;
  partnerId: PartnerId;
  price?: { amount: number; currency: "GBP" | "EUR" | "USD" };
  url?: string; // optional deep-link, can be built later
  status: SavedItemStatus;
  addedAtIso: string;
};

export type Trip = {
  id: string;
  name: string;
  fixture: {
    fixtureId: string;
    homeName: string;
    awayName: string;
    leagueName: string;
    kickoffIso: string; // can be TBD later
    venueName: string;
    cityName: string;
    countryName: string;
  };
  items: SavedItem[];
  notes?: string;
  createdAtIso: string;
};

const nowIso = () => new Date().toISOString();

export const MOCK_TRIPS: Trip[] = [
  {
    id: "trip_001",
    name: "Barcelona weekend",
    fixture: {
      fixtureId: "barca-v-rma-2026-03-22",
      homeName: "FC Barcelona",
      awayName: "Real Madrid",
      leagueName: "La Liga",
      kickoffIso: "2026-03-22T20:00:00.000Z",
      venueName: "Estadi Olímpic Lluís Companys",
      cityName: "Barcelona",
      countryName: "Spain",
    },
    createdAtIso: nowIso(),
    notes: "Keep it simple: arrive Friday night, leave Monday morning.",
    items: [
      {
        id: "item_001_tickets",
        category: "tickets",
        title: "Tickets – compare options",
        subtitle: "Barcelona vs Real Madrid",
        partnerId: "sportsevents365",
        price: { amount: 240, currency: "EUR" },
        status: "saved",
        addedAtIso: nowIso(),
      },
      {
        id: "item_002_flight",
        category: "flights",
        title: "Flights (LGW → BCN)",
        subtitle: "Fri–Mon",
        partnerId: "aviasales",
        price: { amount: 165, currency: "GBP" },
        status: "saved",
        addedAtIso: nowIso(),
      },
      {
        id: "item_003_stay",
        category: "stays",
        title: "Hotel shortlist",
        subtitle: "Eixample / Gothic Quarter",
        partnerId: "expedia_stays",
        price: { amount: 420, currency: "GBP" },
        status: "pending",
        addedAtIso: nowIso(),
      },
      {
        id: "item_004_transfer",
        category: "transfers",
        title: "Airport transfer",
        subtitle: "BCN → City centre",
        partnerId: "welcomepickups",
        price: { amount: 38, currency: "EUR" },
        status: "saved",
        addedAtIso: nowIso(),
      },
      {
        id: "item_005_experience",
        category: "experiences",
        title: "Sagrada Família timed entry",
        subtitle: "Saturday morning",
        partnerId: "tiqets",
        price: { amount: 34, currency: "EUR" },
        status: "saved",
        addedAtIso: nowIso(),
      },
      {
        id: "item_006_insurance",
        category: "insurance",
        title: "Travel insurance",
        subtitle: "Weekend cover",
        partnerId: "safetywing",
        status: "saved",
        addedAtIso: nowIso(),
      },
    ],
  },

  {
    id: "trip_002",
    name: "Milan derby day-trip",
    fixture: {
      fixtureId: "inter-v-milan-2026-02-08",
      homeName: "Inter",
      awayName: "AC Milan",
      leagueName: "Serie A",
      kickoffIso: "2026-02-08T19:45:00.000Z",
      venueName: "San Siro",
      cityName: "Milan",
      countryName: "Italy",
    },
    createdAtIso: nowIso(),
    items: [
      {
        id: "item_007_tickets",
        category: "tickets",
        title: "Tickets – shortlist",
        subtitle: "Derby della Madonnina",
        partnerId: "seatpick", // works even while pending approval; just a placeholder item
        status: "saved",
        addedAtIso: nowIso(),
      },
      {
        id: "item_008_flight",
        category: "flights",
        title: "Flights – compare",
        subtitle: "STN/LTN → MXP/BGY",
        partnerId: "expedia",
        status: "saved",
        addedAtIso: nowIso(),
      },
      {
        id: "item_009_transfer",
        category: "transfers",
        title: "Taxi transfer",
        subtitle: "Airport → San Siro area",
        partnerId: "kiwitaxi",
        status: "pending",
        addedAtIso: nowIso(),
      },
      {
        id: "item_010_experience",
        category: "experiences",
        title: "Duomo rooftop access",
        subtitle: "Pre-match",
        partnerId: "getyourguide",
        status: "saved",
        addedAtIso: nowIso(),
      },
      {
        id: "item_011_compensation",
        category: "compensation",
        title: "Flight delay protection",
        subtitle: "Know your compensation options",
        partnerId: "airhelp",
        status: "saved",
        addedAtIso: nowIso(),
      },
    ],
  },
];
