// src/data/stadiums/premierLeagueBosnia.ts
import type { StadiumRecord } from "./types";

const BOSNIA = "Bosnia and Herzegovina";

export const premierLeagueBosniaStadiums: Record<string, StadiumRecord> = {

  "gradski-stadion-banja-luka": {
    stadiumKey: "gradski-stadion-banja-luka",
    name: "Gradski Stadion Banja Luka",
    city: "Banja Luka",
    country: BOSNIA,
    capacity: 9730,
    opened: 1937,
    teamKeys: ["borac-banja-luka"],
    airport: "Banja Luka Airport (BNX)",
    distanceFromAirportKm: 25,
    transit: [
      { label: "Banja Luka city centre", minutes: 10, note: "best visitor base" }
    ],
    stayAreas: [
      { area: "Banja Luka Centre", why: "Best for hotels, restaurants and nightlife" }
    ],
    tips: [
      "Home of Borac, one of Bosnia's biggest clubs",
      "Compact stadium located close to the city centre"
    ]
  },

  "stadion-pod-bijelim-brijegom": {
    stadiumKey: "stadion-pod-bijelim-brijegom",
    name: "Stadion pod Bijelim Brijegom",
    city: "Mostar",
    country: BOSNIA,
    capacity: 9000,
    opened: 1958,
    teamKeys: ["zrinjski"],
    airport: "Mostar Airport (OMO)",
    distanceFromAirportKm: 8,
    transit: [
      { label: "Mostar Old Town", minutes: 10, note: "best visitor base" }
    ],
    stayAreas: [
      { area: "Mostar Old Town", why: "Best base for sightseeing and nightlife" }
    ],
    tips: [
      "Historic ground of Zrinjski Mostar",
      "Mostar is one of the most visited cities in Bosnia"
    ]
  },

  "asims-ferhatovic-hase": {
    stadiumKey: "asims-ferhatovic-hase",
    name: "Asim Ferhatović Hase Stadium",
    city: "Sarajevo",
    country: BOSNIA,
    capacity: 34700,
    opened: 1947,
    teamKeys: ["sarajevo"],
    airport: "Sarajevo Airport (SJJ)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Sarajevo Old Town", minutes: 10, note: "best base for visitors" }
    ],
    stayAreas: [
      { area: "Baščaršija / Old Town", why: "Best area for hotels, food and atmosphere" }
    ],
    tips: [
      "Largest stadium in Bosnia",
      "Used for major matches and international games"
    ]
  },

  "rodjeni-stadium": {
    stadiumKey: "rodjeni-stadium",
    name: "Rođeni Stadium",
    city: "Mostar",
    country: BOSNIA,
    capacity: 7000,
    opened: 2021,
    teamKeys: ["velez"],
    airport: "Mostar Airport (OMO)",
    distanceFromAirportKm: 7,
    transit: [
      { label: "Mostar centre", minutes: 10, note: "best visitor base" }
    ],
    stayAreas: [
      { area: "Mostar Old Town", why: "Best overall visitor base" }
    ],
    tips: [
      "New stadium opened for Velež in recent years",
      "Mostar derby between Zrinjski and Velež is one of Bosnia's biggest fixtures"
    ]
  },

  "pecara-stadium": {
    stadiumKey: "pecara-stadium",
    name: "Stadion Pecara",
    city: "Široki Brijeg",
    country: BOSNIA,
    capacity: 7000,
    opened: 1953,
    teamKeys: ["siroki-brijeg"],
    airport: "Mostar Airport (OMO)",
    distanceFromAirportKm: 35,
    transit: [
      { label: "Široki Brijeg centre", minutes: 10, note: "closest base" }
    ],
    stayAreas: [
      { area: "Mostar", why: "Better hotels and travel base nearby" }
    ],
    tips: [
      "Small but intense stadium atmosphere",
      "Often visited as part of a Mostar trip"
    ]
  },

  "grbavica-stadium": {
    stadiumKey: "grbavica-stadium",
    name: "Grbavica Stadium",
    city: "Sarajevo",
    country: BOSNIA,
    capacity: 16000,
    opened: 1951,
    teamKeys: ["zeljeznicar"],
    airport: "Sarajevo Airport (SJJ)",
    distanceFromAirportKm: 7,
    transit: [
      { label: "Sarajevo centre", minutes: 10, note: "best visitor base" }
    ],
    stayAreas: [
      { area: "Sarajevo Old Town", why: "Best for hotels, food and nightlife" }
    ],
    tips: [
      "Home of Željezničar",
      "One of Bosnia's most atmospheric stadiums"
    ]
  },

  "gradski-stadion-bijeljina": {
    stadiumKey: "gradski-stadion-bijeljina",
    name: "Gradski Stadion Bijeljina",
    city: "Bijeljina",
    country: BOSNIA,
    capacity: 6000,
    teamKeys: ["radnik-bijeljina"],
    airport: "Tuzla Airport (TZL)",
    distanceFromAirportKm: 70,
    transit: [
      { label: "Bijeljina centre", minutes: 10, note: "best local anchor" }
    ],
    stayAreas: [
      { area: "Bijeljina Centre", why: "Closest practical base" }
    ],
    tips: [
      "Small regional stadium"
    ]
  },

  "mokri-dolac": {
    stadiumKey: "mokri-dolac",
    name: "Mokri Dolac Stadium",
    city: "Posušje",
    country: BOSNIA,
    capacity: 8000,
    teamKeys: ["posusje"],
    airport: "Mostar Airport (OMO)",
    distanceFromAirportKm: 50,
    transit: [
      { label: "Posušje centre", minutes: 10, note: "best local anchor" }
    ],
    stayAreas: [
      { area: "Mostar", why: "Better travel base" }
    ],
    tips: [
      "Modernised stadium with mountain surroundings"
    ]
  },

  "gradski-stadion-prijedor": {
    stadiumKey: "gradski-stadion-prijedor",
    name: "Gradski Stadion Prijedor",
    city: "Prijedor",
    country: BOSNIA,
    capacity: 6000,
    teamKeys: ["rudar-prijedor"],
    airport: "Banja Luka Airport (BNX)",
    distanceFromAirportKm: 70,
    transit: [
      { label: "Prijedor centre", minutes: 10, note: "best local base" }
    ],
    stayAreas: [
      { area: "Banja Luka", why: "Better hotels and nightlife" }
    ],
    tips: [
      "Small regional ground"
    ]
  },

  "luke-stadium": {
    stadiumKey: "luke-stadium",
    name: "Luke Stadium",
    city: "Doboj",
    country: BOSNIA,
    capacity: 3000,
    teamKeys: ["sloga-doboj"],
    airport: "Tuzla Airport (TZL)",
    distanceFromAirportKm: 70,
    transit: [
      { label: "Doboj centre", minutes: 10, note: "best local anchor" }
    ],
    stayAreas: [
      { area: "Doboj Centre", why: "Closest practical option" }
    ],
    tips: [
      "Small stadium used by Sloga Doboj"
    ]
  }

};

export default premierLeagueBosniaStadiums;
