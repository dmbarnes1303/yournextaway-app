// src/data/stadiums/firstDivisionCyprus.ts
import type { StadiumRecord } from "./types";

const CYPRUS = "Cyprus";

export const firstDivisionCyprusStadiums: Record<string, StadiumRecord> = {
  "gsp-stadium": {
    stadiumKey: "gsp-stadium",
    name: "GSP Stadium",
    city: "Strovolos",
    country: CYPRUS,
    capacity: 22859,
    opened: 1999,
    teamKeys: ["omonoia-nicosia", "apoel", "olympiakos-nicosia"],
    airport: "Larnaca International Airport (LCA)",
    distanceFromAirportKm: 50,
    transit: [
      { label: "Nicosia city centre", minutes: 15, note: "best main visitor base" },
      { label: "Strovolos", minutes: 10, note: "closest practical area" },
    ],
    stayAreas: [
      { area: "Nicosia City Centre", why: "Best all-round base for hotels, food and nightlife" },
      { area: "Strovolos", why: "Closer and more practical if match access matters most" },
    ],
    tips: [
      "Largest stadium in Cyprus and the main shared base for Nicosia's biggest clubs",
      "Most visitors should stay in central Nicosia rather than by the ground itself",
    ],
  },

  "alphamega-stadium": {
    stadiumKey: "alphamega-stadium",
    name: "Alphamega Stadium",
    city: "Kolossi",
    country: CYPRUS,
    capacity: 10700,
    opened: 2022,
    teamKeys: ["apollon-limassol", "aris-limassol", "ael-limassol"],
    airport: "Paphos International Airport (PFO)",
    distanceFromAirportKm: 55,
    transit: [
      { label: "Limassol city centre", minutes: 20, note: "best visitor base" },
      { label: "Kolossi", minutes: 8, note: "closest local anchor" },
    ],
    stayAreas: [
      { area: "Limassol Marina / Old Town", why: "Best nightlife, restaurants and overall city-break feel" },
      { area: "Germasogeia tourist area", why: "Best hotel-heavy seafront base" },
    ],
    tips: [
      "Modern shared stadium for Limassol's top clubs",
      "Stay in Limassol proper, not by the stadium, unless convenience is your only priority",
    ],
  },

  "aek-arena": {
    stadiumKey: "aek-arena",
    name: "AEK Arena",
    city: "Larnaca",
    country: CYPRUS,
    capacity: 7400,
    opened: 2016,
    teamKeys: ["aek-larnaca"],
    airport: "Larnaca International Airport (LCA)",
    distanceFromAirportKm: 8,
    transit: [
      { label: "Larnaca city centre", minutes: 10, note: "best practical base" },
      { label: "Finikoudes", minutes: 12, note: "best seafront visitor area" },
    ],
    stayAreas: [
      { area: "Finikoudes", why: "Best overall base for seafront hotels, bars and restaurants" },
      { area: "Larnaca Centre", why: "Best practical base for short match trips" },
    ],
    tips: [
      "One of the easiest Cypriot grounds for airport-to-stadium logistics",
      "Very easy to combine with a simple Larnaca weekend break",
    ],
  },

  "stelios-kyriakides-stadium": {
    stadiumKey: "stelios-kyriakides-stadium",
    name: "Stelios Kyriakides Stadium",
    city: "Paphos",
    country: CYPRUS,
    capacity: 9394,
    opened: 1985,
    teamKeys: ["pafos"],
    airport: "Paphos International Airport (PFO)",
    distanceFromAirportKm: 14,
    transit: [
      { label: "Paphos city centre", minutes: 10, note: "best practical base" },
      { label: "Kato Paphos", minutes: 15, note: "best tourist base" },
    ],
    stayAreas: [
      { area: "Kato Paphos", why: "Best overall base for hotels, bars and seafront atmosphere" },
      { area: "Paphos Centre", why: "More practical for short stadium-focused stays" },
    ],
    tips: [
      "Best treated as a football-plus-sun trip rather than just a match stop",
      "Paphos is one of the strongest leisure destinations in the whole app footprint",
    ],
  },

  "antonis-papadopoulos-stadium": {
    stadiumKey: "antonis-papadopoulos-stadium",
    name: "Antonis Papadopoulos Stadium",
    city: "Larnaca",
    country: CYPRUS,
    capacity: 10230,
    opened: 1986,
    teamKeys: ["anorthosis", "omonia-aradippou"],
    airport: "Larnaca International Airport (LCA)",
    distanceFromAirportKm: 13,
    transit: [
      { label: "Larnaca city centre", minutes: 12, note: "best main visitor base" },
      { label: "Ammochostos / surrounding area", minutes: 8, note: "closest local anchor" },
    ],
    stayAreas: [
      { area: "Larnaca Centre", why: "Best all-round practical base for hotels and food" },
      { area: "Finikoudes", why: "Best if you want the stronger seafront city-break option" },
    ],
    tips: [
      "Traditional Cypriot football venue with stronger atmosphere than the raw size suggests",
      "For visitors, Larnaca is the obvious and smartest place to stay",
    ],
  },

  "chloraka-municipal-stadium": {
    stadiumKey: "chloraka-municipal-stadium",
    name: "Chloraka Municipal Stadium",
    city: "Chloraka",
    country: CYPRUS,
    capacity: 3500,
    teamKeys: ["akritas-chlorakas"],
    airport: "Paphos International Airport (PFO)",
    distanceFromAirportKm: 22,
    transit: [
      { label: "Paphos centre", minutes: 15, note: "best wider visitor base" },
      { label: "Chloraka", minutes: 5, note: "closest local anchor" },
    ],
    stayAreas: [
      { area: "Kato Paphos", why: "Best for hotels, restaurants and better overall trip quality" },
      { area: "Chloraka", why: "Closest simple option if convenience matters most" },
    ],
    tips: [
      "Small local ground, so this is a Paphos-area trip first and a stadium trip second",
      "Do not overthink the logistics — staying in Paphos is the best move",
    ],
  },

  "stelios-chari-stadium": {
    stadiumKey: "stelios-chari-stadium",
    name: "Stelios Chari Stadium",
    city: "Ypsonas",
    country: CYPRUS,
    capacity: 2500,
    teamKeys: ["digenis-ypsonas"],
    airport: "Paphos International Airport (PFO)",
    distanceFromAirportKm: 50,
    transit: [
      { label: "Limassol city centre", minutes: 20, note: "best main visitor base" },
      { label: "Ypsonas", minutes: 8, note: "closest local anchor" },
    ],
    stayAreas: [
      { area: "Limassol Marina / Old Town", why: "Best overall visitor base for football plus nightlife" },
      { area: "Ypsonas", why: "Closest practical base if you only care about the match" },
    ],
    tips: [
      "Small-scale venue, not a destination stadium",
      "Treat this as a Limassol trip and travel into Ypsonas",
    ],
  },

  "dasaki-stadium": {
    stadiumKey: "dasaki-stadium",
    name: "Dasaki Stadium",
    city: "Achna",
    country: CYPRUS,
    capacity: 7000,
    teamKeys: ["ethnikos-achna"],
    airport: "Larnaca International Airport (LCA)",
    distanceFromAirportKm: 28,
    transit: [
      { label: "Larnaca", minutes: 25, note: "best wider visitor base" },
      { label: "Achna", minutes: 5, note: "closest local anchor" },
    ],
    stayAreas: [
      { area: "Larnaca", why: "Best practical base with better hotel options" },
      { area: "Ayia Napa / Protaras", why: "Best if combining football with a resort stay" },
    ],
    tips: [
      "Very manageable eastern Cyprus football stop",
      "Most visitors will be better off staying on the coast and travelling in",
    ],
  },

  "paralimni-stadium": {
    stadiumKey: "paralimni-stadium",
    name: "Paralimni Stadium",
    city: "Paralimni",
    country: CYPRUS,
    capacity: 5800,
    teamKeys: ["enosis-paralimni"],
    airport: "Larnaca International Airport (LCA)",
    distanceFromAirportKm: 58,
    transit: [
      { label: "Paralimni centre", minutes: 10, note: "best local anchor" },
      { label: "Protaras", minutes: 15, note: "best tourist base nearby" },
    ],
    stayAreas: [
      { area: "Protaras", why: "Best overall base for hotels and seaside atmosphere" },
      { area: "Paralimni", why: "Closest practical option for the match itself" },
    ],
    tips: [
      "Easy to pair with an east-coast Cyprus break",
      "Protaras is usually the best overnight choice unless you want maximum simplicity",
    ],
  },

  "makario-stadium": {
    stadiumKey: "makario-stadium",
    name: "Makario Stadium",
    city: "Nicosia",
    country: CYPRUS,
    capacity: 16000,
    teamKeys: [],
    airport: "Larnaca International Airport (LCA)",
    distanceFromAirportKm: 52,
    transit: [
      { label: "Nicosia city centre", minutes: 15, note: "best main base" },
    ],
    stayAreas: [
      { area: "Nicosia City Centre", why: "Best all-round base for any Nicosia football trip" },
    ],
    tips: [
      "Keep this in reserve only if club licensing/home arrangements change",
    ],
  },
};

export default firstDivisionCyprusStadiums;
