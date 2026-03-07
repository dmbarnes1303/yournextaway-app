import type { StadiumRecord } from "./types";

const SWEDEN = "Sweden";

export const allsvenskanStadiums: Record<string, StadiumRecord> = {

  "strawberry-arena": {
    stadiumKey: "strawberry-arena",
    name: "Strawberry Arena",
    city: "Stockholm",
    country: SWEDEN,
    capacity: 50000,
    opened: 2012,
    teamKeys: ["aik"],
    airport: "Stockholm Arlanda Airport (ARN)",
    distanceFromAirportKm: 36,
    transit: [
      { label: "Solna Station", minutes: 8 },
      { label: "Stockholm Central", minutes: 20 }
    ],
    stayAreas: [
      { area: "Stockholm City Centre", why: "Best base for nightlife, hotels and transport" },
      { area: "Solna", why: "Closest stay option to the stadium" }
    ]
  },

  "3arena": {
    stadiumKey: "3arena",
    name: "3Arena",
    city: "Stockholm",
    country: SWEDEN,
    capacity: 30000,
    opened: 2013,
    teamKeys: ["djurgarden", "hammarby"],
    airport: "Stockholm Arlanda Airport (ARN)",
    distanceFromAirportKm: 43,
    transit: [
      { label: "Globen Station", minutes: 6 },
      { label: "Stockholm Central", minutes: 15 }
    ],
    stayAreas: [
      { area: "Södermalm", why: "Best nightlife area in Stockholm and close to the stadium" },
      { area: "Stockholm City Centre", why: "Best for transport and hotels" }
    ]
  },

  "gamla-ullevi": {
    stadiumKey: "gamla-ullevi",
    name: "Gamla Ullevi",
    city: "Gothenburg",
    country: SWEDEN,
    capacity: 18000,
    opened: 2009,
    teamKeys: ["gais", "goteborg", "ois"],
    airport: "Gothenburg Landvetter Airport (GOT)",
    distanceFromAirportKm: 25,
    transit: [
      { label: "Gothenburg Central Station", minutes: 10 }
    ],
    stayAreas: [
      { area: "Central Gothenburg", why: "Best overall base for bars, restaurants and transport" }
    ]
  },

  "bravida-arena": {
    stadiumKey: "bravida-arena",
    name: "Bravida Arena",
    city: "Gothenburg",
    country: SWEDEN,
    capacity: 7000,
    opened: 2015,
    teamKeys: ["hacken"],
    airport: "Gothenburg Landvetter Airport (GOT)",
    distanceFromAirportKm: 29,
    transit: [
      { label: "Hisingen Tram Stops", minutes: 10 }
    ],
    stayAreas: [
      { area: "Central Gothenburg", why: "Best choice for hotels and nightlife" }
    ]
  },

  "orjans-vall": {
    stadiumKey: "orjans-vall",
    name: "Örjans Vall",
    city: "Halmstad",
    country: SWEDEN,
    capacity: 15000,
    opened: 1922,
    teamKeys: ["halmstad"],
    airport: "Halmstad Airport (HAD)",
    distanceFromAirportKm: 3
  },

  "grimsta-ip": {
    stadiumKey: "grimsta-ip",
    name: "Grimsta IP",
    city: "Stockholm",
    country: SWEDEN,
    capacity: 7500,
    opened: 1963,
    teamKeys: ["brommapojkarna"],
    airport: "Stockholm Arlanda Airport (ARN)",
    distanceFromAirportKm: 36
  },

  "boras-arena": {
    stadiumKey: "boras-arena",
    name: "Borås Arena",
    city: "Borås",
    country: SWEDEN,
    capacity: 16500,
    opened: 2005,
    teamKeys: ["elfsborg"],
    airport: "Gothenburg Landvetter Airport (GOT)",
    distanceFromAirportKm: 40
  },

  "studenternas-ip": {
    stadiumKey: "studenternas-ip",
    name: "Studenternas IP",
    city: "Uppsala",
    country: SWEDEN,
    capacity: 10000,
    opened: 2020,
    teamKeys: ["sirius"],
    airport: "Stockholm Arlanda Airport (ARN)",
    distanceFromAirportKm: 36
  },

  "guldfageln-arena": {
    stadiumKey: "guldfageln-arena",
    name: "Guldfågeln Arena",
    city: "Kalmar",
    country: SWEDEN,
    capacity: 12000,
    opened: 2011,
    teamKeys: ["kalmar"],
    airport: "Kalmar Airport (KLR)",
    distanceFromAirportKm: 6
  },

  "eleda-stadion": {
    stadiumKey: "eleda-stadion",
    name: "Eleda Stadion",
    city: "Malmö",
    country: SWEDEN,
    capacity: 22500,
    opened: 2009,
    teamKeys: ["malmo"],
    airport: "Malmö Airport (MMX)",
    distanceFromAirportKm: 30,
    transit: [
      { label: "Triangeln Station", minutes: 15 },
      { label: "Malmö Central Station", minutes: 20 }
    ]
  },

  "strandvallen": {
    stadiumKey: "strandvallen",
    name: "Strandvallen",
    city: "Hällevik",
    country: SWEDEN,
    capacity: 7500,
    opened: 1953,
    teamKeys: ["mjalby"],
    airport: "Ronneby Airport (RNB)",
    distanceFromAirportKm: 45
  },

  "stora-valla": {
    stadiumKey: "stora-valla",
    name: "Stora Valla",
    city: "Degerfors",
    country: SWEDEN,
    capacity: 12500,
    opened: 1938,
    teamKeys: ["degersfors"]
  },

  "hitachi-energy-arena": {
    stadiumKey: "hitachi-energy-arena",
    name: "Hitachi Energy Arena",
    city: "Västerås",
    country: SWEDEN,
    capacity: 7000,
    opened: 1967,
    teamKeys: ["vasteras"]
  }

};

export default allsvenskanStadiums;
