import type { StadiumRecord } from "./types";

const superLeagueGreeceStadiums: Record<string, StadiumRecord> = {
  "karaiskakis-stadium": {
    stadiumKey: "karaiskakis-stadium",
    name: "Karaiskakis Stadium",
    city: "Piraeus",
    country: "Greece",
    capacity: 32115,
    opened: 1895,
    airport: "Athens International Airport (ATH)",
    distanceFromAirportKm: 45,
    teamKeys: ["olympiacos"],
    transit: [
      { label: "Faliro", minutes: 5 },
      { label: "Piraeus", minutes: 15, note: "best wider ferry and rail hub" },
    ],
    stayAreas: [
      { area: "Athens Centre", why: "Best overall city-break base" },
      { area: "Piraeus / Marina Zeas", why: "Best if combining football with port or island travel" },
    ],
    tips: [
      "One of Greece’s strongest atmosphere-led football trips",
      "Most visitors should stay in central Athens or Piraeus rather than right by the ground",
    ],
  },

  "apostolos-nikolaidis": {
    stadiumKey: "apostolos-nikolaidis",
    name: "Apostolos Nikolaidis Stadium",
    city: "Athens",
    country: "Greece",
    capacity: 16000,
    opened: 1922,
    airport: "Athens International Airport (ATH)",
    distanceFromAirportKm: 32,
    teamKeys: ["panathinaikos"],
    transit: [
      { label: "Ambelokipi", minutes: 8 },
      { label: "Syntagma", minutes: 15, note: "best wider central Athens hub" },
    ],
    stayAreas: [
      { area: "Syntagma / Plaka", why: "Best classic Athens base" },
      { area: "Kolonaki", why: "Best polished central stay with easy local access" },
    ],
    tips: [
      "More intimate and traditional-feeling than larger bowl stadiums",
      "Central Athens is the right base and makes this a very easy city football trip",
    ],
  },

  "agia-sofia-stadium": {
    stadiumKey: "agia-sofia-stadium",
    name: "Agia Sofia Stadium",
    city: "Athens",
    country: "Greece",
    capacity: 32500,
    opened: 2022,
    airport: "Athens International Airport (ATH)",
    distanceFromAirportKm: 28,
    teamKeys: ["aek-athens"],
    transit: [
      { label: "Perissos", minutes: 15 },
      { label: "Omonia / Monastiraki", minutes: 20, note: "best wider central base" },
    ],
    stayAreas: [
      { area: "Syntagma / Plaka", why: "Best all-round Athens city-break base" },
      { area: "Psyrri / Monastiraki", why: "Best bars, nightlife and local atmosphere" },
    ],
    tips: [
      "One of the strongest modern matchday experiences in Greece",
      "Better as a central Athens trip than a stay in the immediate stadium district",
    ],
  },

  "toumba-stadium": {
    stadiumKey: "toumba-stadium",
    name: "Toumba Stadium",
    city: "Thessaloniki",
    country: "Greece",
    capacity: 28703,
    opened: 1959,
    airport: "Thessaloniki Airport (SKG)",
    distanceFromAirportKm: 14,
    teamKeys: ["paok"],
    transit: [
      { label: "Thessaloniki Centre", minutes: 20 },
      { label: "Aristotelous / seafront", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Ladadika", why: "Best food, bars and nightlife" },
      { area: "Seafront / White Tower", why: "Best scenic central base" },
    ],
    tips: [
      "One of the best atmosphere trips in southeastern Europe",
      "Thessaloniki is strong enough to make this a proper long-weekend football trip",
    ],
  },

  "kleanthis-vikelidis-stadium": {
    stadiumKey: "kleanthis-vikelidis-stadium",
    name: "Kleanthis Vikelidis Stadium",
    city: "Thessaloniki",
    country: "Greece",
    capacity: 22800,
    opened: 1951,
    airport: "Thessaloniki Airport (SKG)",
    distanceFromAirportKm: 13,
    teamKeys: ["aris"],
    transit: [
      { label: "Thessaloniki Centre", minutes: 20 },
      { label: "White Tower / centre", minutes: 20, note: "best practical base" },
    ],
    stayAreas: [
      { area: "Ladadika", why: "Best nightlife and restaurant base" },
      { area: "Seafront", why: "Best scenic central option" },
    ],
    tips: [
      "Another strong Thessaloniki-based football trip with a more local-feel edge",
      "Stay central and treat the ground as a short local journey",
    ],
  },

  "theodoros-kolokotronis": {
    stadiumKey: "theodoros-kolokotronis",
    name: "Theodoros Kolokotronis Stadium",
    city: "Tripoli",
    country: "Greece",
    capacity: 7442,
    opened: 1953,
    airport: "Athens International Airport (ATH)",
    distanceFromAirportKm: 180,
    teamKeys: ["asteras-tripolis"],
    transit: [
      { label: "Tripoli Centre", minutes: 15 },
      { label: "Bus station", minutes: 15, note: "best practical arrival point" },
    ],
    stayAreas: [
      { area: "Tripoli Centre", why: "Most practical local base" },
      { area: "Athens", why: "Better wider base if not staying purely for the match" },
    ],
    tips: [
      "Much more of a football stop than a glamour city-break destination",
      "Best approached as part of a wider Peloponnese or Athens-based trip",
    ],
  },

  "peristeri-stadium": {
    stadiumKey: "peristeri-stadium",
    name: "Peristeri Stadium",
    city: "Athens",
    country: "Greece",
    capacity: 10050,
    opened: 1947,
    airport: "Athens International Airport (ATH)",
    distanceFromAirportKm: 35,
    teamKeys: ["atromitos"],
    transit: [
      { label: "Anthoupoli / Peristeri", minutes: 15 },
      { label: "Syntagma", minutes: 20, note: "best central Athens hub" },
    ],
    stayAreas: [
      { area: "Syntagma / Plaka", why: "Best central Athens base" },
      { area: "Monastiraki / Psyrri", why: "Best atmosphere and nightlife" },
    ],
    tips: [
      "This is an Athens football trip first, local club trip second",
      "Central Athens remains the right base for almost everyone",
    ],
  },

  "theodoros-vardinogiannis": {
    stadiumKey: "theodoros-vardinogiannis",
    name: "Theodoros Vardinogiannis Stadium",
    city: "Heraklion",
    country: "Greece",
    capacity: 9000,
    opened: 1951,
    airport: "Heraklion Airport (HER)",
    distanceFromAirportKm: 5,
    teamKeys: ["ofi"],
    transit: [
      { label: "Heraklion Centre", minutes: 15 },
      { label: "Port / old centre", minutes: 15, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Heraklion Centre", why: "Best practical city base" },
      { area: "Port / old town", why: "Best atmosphere and easiest visitor stay" },
    ],
    tips: [
      "Very good football-and-island trip because Crete adds real leisure value",
      "This is stronger as a wider Crete weekend than as a pure football stop",
    ],
  },

  "panthessaliko-stadium": {
    stadiumKey: "panthessaliko-stadium",
    name: "Panthessaliko Stadium",
    city: "Volos",
    country: "Greece",
    capacity: 22189,
    opened: 2004,
    airport: "Nea Anchialos National Airport (VOL)",
    distanceFromAirportKm: 25,
    teamKeys: ["volos"],
    transit: [
      { label: "Volos Centre", minutes: 20 },
      { label: "Waterfront", minutes: 20, note: "best local visitor base" },
    ],
    stayAreas: [
      { area: "Waterfront / Centre", why: "Best practical and atmospheric local base" },
      { area: "Near port", why: "Best for a simple overnight with restaurants nearby" },
    ],
    tips: [
      "A more underrated coastal football stop than many people expect",
      "Works best as a one- or two-night trip rather than a rushed same-day outing",
    ],
  },

  "levadia-municipal-stadium": {
    stadiumKey: "levadia-municipal-stadium",
    name: "Levadia Municipal Stadium",
    city: "Livadeia",
    country: "Greece",
    capacity: 5915,
    opened: 1952,
    airport: "Athens International Airport (ATH)",
    distanceFromAirportKm: 135,
    teamKeys: ["levadiakos"],
    transit: [
      { label: "Livadeia Centre", minutes: 10 },
      { label: "Rail station", minutes: 15, note: "best arrival point" },
    ],
    stayAreas: [
      { area: "Livadeia Centre", why: "Most practical local base" },
      { area: "Athens", why: "Better wider base if not making this a dedicated overnight" },
    ],
    tips: [
      "This is a football stop rather than a premium city-break destination",
      "Best handled as a short practical trip or part of a wider Greece route",
    ],
  },

  "zirineio-stadium": {
    stadiumKey: "zirineio-stadium",
    name: "Zirineio Stadium",
    city: "Athens",
    country: "Greece",
    capacity: 3500,
    opened: 1950,
    airport: "Athens International Airport (ATH)",
    distanceFromAirportKm: 30,
    teamKeys: ["kifisia"],
    transit: [
      { label: "Kifisia", minutes: 10 },
      { label: "Syntagma", minutes: 30, note: "best wider central Athens base" },
    ],
    stayAreas: [
      { area: "Kifisia", why: "Best if you want an upmarket northern Athens stay" },
      { area: "Syntagma / Kolonaki", why: "Best overall Athens city-break base" },
    ],
    tips: [
      "A smaller-ground Athens-area trip rather than a headline Greek football weekend",
      "Central Athens still makes the most sense for most visitors",
    ],
  },

  "panetolikos-stadium": {
    stadiumKey: "panetolikos-stadium",
    name: "Panetolikos Stadium",
    city: "Agrinio",
    country: "Greece",
    capacity: 7000,
    opened: 1930,
    airport: "Araxos Airport (GPA)",
    distanceFromAirportKm: 95,
    teamKeys: ["panetolikos"],
    transit: [
      { label: "Agrinio Centre", minutes: 10 },
      { label: "Bus station", minutes: 10, note: "best practical arrival point" },
    ],
    stayAreas: [
      { area: "Agrinio Centre", why: "Most practical local stay option" },
      { area: "Patras", why: "Better wider regional base if combining destinations" },
    ],
    tips: [
      "A committed domestic-football stop rather than a major international city-break product",
      "Best as a one-night football-led trip",
    ],
  },

  "alkazar-stadium": {
    stadiumKey: "alkazar-stadium",
    name: "Alkazar Stadium",
    city: "Larissa",
    country: "Greece",
    capacity: 13000,
    opened: 1965,
    airport: "Thessaloniki Airport (SKG)",
    distanceFromAirportKm: 160,
    teamKeys: ["ael"],
    transit: [
      { label: "Larissa Centre", minutes: 10 },
      { label: "Rail station", minutes: 15, note: "best arrival point" },
    ],
    stayAreas: [
      { area: "Larissa Centre", why: "Best practical local base" },
      { area: "Near central square", why: "Best restaurants and easy walkability" },
    ],
    tips: [
      "A strong traditional-club stop but not one of the flashier Greek football weekends",
      "Works best as a tidy overnight football trip",
    ],
  },

  "serres-municipal-stadium": {
    stadiumKey: "serres-municipal-stadium",
    name: "Serres Municipal Stadium",
    city: "Serres",
    country: "Greece",
    capacity: 9500,
    opened: 1926,
    airport: "Thessaloniki Airport (SKG)",
    distanceFromAirportKm: 105,
    teamKeys: ["panserraikos"],
    transit: [
      { label: "Serres Centre", minutes: 10 },
      { label: "Bus station", minutes: 10, note: "best practical arrival point" },
    ],
    stayAreas: [
      { area: "Serres Centre", why: "Most practical local base" },
      { area: "Thessaloniki", why: "Better wider regional base if combining multiple matches" },
    ],
    tips: [
      "More of a football-coverage stop than a polished city-break product",
      "Often makes more sense as part of a wider northern Greece itinerary",
    ],
  },
};

export default superLeagueGreeceStadiums;
