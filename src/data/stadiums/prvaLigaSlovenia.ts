// src/data/stadiums/prvaLigaSlovenia.ts
import type { StadiumRecord } from "./types";

const SLOVENIA = "Slovenia";

export const prvaLigaSloveniaStadiums: Record<string, StadiumRecord> = {
  "stadion-zdezele": {
    stadiumKey: "stadion-zdezele",
    name: "Stadion Z'dežele",
    city: "Celje",
    country: SLOVENIA,
    capacity: 13059,
    opened: 2003,
    teamKeys: ["celje"],
    airport: "Ljubljana Jože Pučnik Airport (LJU)",
    distanceFromAirportKm: 79,
    transit: [
      { label: "Celje railway station", minutes: 25, note: "best mainline rail hub" },
      { label: "Celje centre", minutes: 20, note: "best practical city anchor" },
    ],
    stayAreas: [
      { area: "Celje Centre", why: "Best practical base for station access, food and short taxi rides" },
      { area: "Ljubljana", why: "Better nightlife and hotel depth if you are happy to travel in" },
    ],
    tips: [
      "Largest ground in the league outside Ljubljana and one of the best-equipped stadiums in Slovenia",
      "Celje works fine for a simple overnight, but Ljubljana is the stronger wider trip base",
    ],
  },

  "ljudski-vrt": {
    stadiumKey: "ljudski-vrt",
    name: "Ljudski vrt",
    city: "Maribor",
    country: SLOVENIA,
    capacity: 11709,
    opened: 1952,
    teamKeys: ["maribor"],
    airport: "Graz Airport (GRZ)",
    distanceFromAirportKm: 69,
    transit: [
      { label: "Maribor railway station", minutes: 20, note: "best rail arrival point" },
      { label: "Maribor Old Town", minutes: 15, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Maribor Old Town", why: "Best for bars, restaurants and a proper city-break feel" },
      { area: "Near the railway station", why: "Best if onward train convenience matters most" },
    ],
    tips: [
      "One of the most historic and atmospheric club grounds in Slovenia",
      "Maribor is one of the best football-weekend cities in the country, so staying central makes the most sense",
    ],
  },

  "bonifika": {
    stadiumKey: "bonifika",
    name: "Bonifika",
    city: "Koper",
    country: SLOVENIA,
    capacity: 4047,
    opened: 1948,
    teamKeys: ["koper"],
    airport: "Trieste Airport (TRS)",
    distanceFromAirportKm: 66,
    transit: [
      { label: "Koper centre", minutes: 15, note: "best local base" },
      { label: "Koper bus station", minutes: 20, note: "best practical arrival point for visitors" },
    ],
    stayAreas: [
      { area: "Koper Old Town", why: "Best compact coastal base with restaurants and seafront feel" },
      { area: "Piran / Portorož", why: "Better if you want more of an Adriatic weekend-break vibe" },
    ],
    tips: [
      "This is more of a coastal football stop than a big-stadium trip",
      "Very easy to combine with a short Slovenian coast break",
    ],
  },

  "stozice-stadium": {
    stadiumKey: "stozice-stadium",
    name: "Stožice Stadium",
    city: "Ljubljana",
    country: SLOVENIA,
    capacity: 16038,
    opened: 2010,
    teamKeys: ["olimpija-ljubljana", "bravo"],
    airport: "Ljubljana Jože Pučnik Airport (LJU)",
    distanceFromAirportKm: 27,
    transit: [
      { label: "Ljubljana railway station", minutes: 15, note: "best mainline arrival point" },
      { label: "Bežigrad / Stožice bus links", minutes: 8, note: "best public transport approach" },
    ],
    stayAreas: [
      { area: "Ljubljana Old Town / Centre", why: "Best all-round base for hotels, bars and city atmosphere" },
      { area: "Bežigrad", why: "Closest practical stay if stadium convenience matters most" },
    ],
    tips: [
      "Biggest stadium in the country and the clear top choice for a Slovenia football weekend",
      "City-centre Ljubljana is the smartest base by far unless you only care about ground proximity",
    ],
  },

  "sportni-park-domzale": {
    stadiumKey: "sportni-park-domzale",
    name: "Športni park Domžale",
    city: "Domžale",
    country: SLOVENIA,
    capacity: 3100,
    opened: 1948,
    teamKeys: ["domzale"],
    airport: "Ljubljana Jože Pučnik Airport (LJU)",
    distanceFromAirportKm: 16,
    transit: [
      { label: "Domžale railway station", minutes: 15, note: "best local rail option" },
      { label: "Ljubljana centre", minutes: 20, note: "best wider visitor base" },
    ],
    stayAreas: [
      { area: "Ljubljana Centre", why: "Far better hotel, food and nightlife choice than staying in Domžale" },
      { area: "Domžale", why: "Closest simple option if you want a quiet match-focused stop" },
    ],
    tips: [
      "Functional smaller ground rather than a major destination stadium",
      "Most visitors should stay in Ljubljana and travel in",
    ],
  },

  "sportni-park-radomlje": {
    stadiumKey: "sportni-park-radomlje",
    name: "Športni park Radomlje",
    city: "Radomlje",
    country: SLOVENIA,
    capacity: 1200,
    opened: 1948,
    teamKeys: ["radomlje"],
    airport: "Ljubljana Jože Pučnik Airport (LJU)",
    distanceFromAirportKm: 19,
    transit: [
      { label: "Domžale", minutes: 10, note: "best nearby transport anchor" },
      { label: "Ljubljana centre", minutes: 25, note: "best overall visitor base" },
    ],
    stayAreas: [
      { area: "Ljubljana Centre", why: "Best by a mile for hotels, bars and overall trip quality" },
      { area: "Domžale", why: "Closest practical local base" },
    ],
    tips: [
      "Very small-scale ground, so this is not a stadium-led trip",
      "Treat it as a Ljubljana-area fixture rather than building the whole trip around Radomlje itself",
    ],
  },

  "sportni-park-aluminij": {
    stadiumKey: "sportni-park-aluminij",
    name: "Športni park Aluminij",
    city: "Kidričevo",
    country: SLOVENIA,
    capacity: 1200,
    opened: 1950,
    teamKeys: ["aluminij"],
    airport: "Graz Airport (GRZ)",
    distanceFromAirportKm: 51,
    transit: [
      { label: "Ptuj", minutes: 15, note: "best nearby visitor anchor" },
      { label: "Maribor", minutes: 30, note: "better wider rail and stay base" },
    ],
    stayAreas: [
      { area: "Ptuj", why: "Closest attractive overnight option with a more interesting centre" },
      { area: "Maribor", why: "Better for hotels, nightlife and wider transport" },
    ],
    tips: [
      "This is a very small football stop, not a glamour trip",
      "Ptuj or Maribor usually makes more sense than staying in Kidričevo itself",
    ],
  },

  "fazanerija": {
    stadiumKey: "fazanerija",
    name: "Mestni stadion Fazanerija",
    city: "Murska Sobota",
    country: SLOVENIA,
    capacity: 4506,
    opened: 1936,
    teamKeys: ["mura"],
    airport: "Graz Airport (GRZ)",
    distanceFromAirportKm: 104,
    transit: [
      { label: "Murska Sobota station", minutes: 20, note: "best rail anchor" },
      { label: "Murska Sobota centre", minutes: 12, note: "best local visitor base" },
    ],
    stayAreas: [
      { area: "Murska Sobota Centre", why: "Best practical local option for a simple overnight" },
      { area: "Maribor", why: "Better if you want a stronger city base and don’t mind extra travel" },
    ],
    tips: [
      "One of the more distinctive club atmospheres in Slovenia",
      "Best treated as a football-first trip rather than a classic city-break destination",
    ],
  },

  "mestni-stadion-ajdovscina": {
    stadiumKey: "mestni-stadion-ajdovscina",
    name: "Mestni stadion v Ajdovščini",
    city: "Ajdovščina",
    country: SLOVENIA,
    capacity: 3000,
    opened: 1929,
    teamKeys: ["primorje"],
    airport: "Trieste Airport (TRS)",
    distanceFromAirportKm: 44,
    transit: [
      { label: "Ajdovščina centre", minutes: 10, note: "best local anchor" },
      { label: "Nova Gorica", minutes: 30, note: "best nearby larger base" },
    ],
    stayAreas: [
      { area: "Ajdovščina", why: "Closest and simplest option for a pure match stop" },
      { area: "Vipava Valley", why: "Better if you want a more scenic wine-region stay" },
    ],
    tips: [
      "Good option if you want to mix football with a western Slovenia road trip",
      "Small ground and simple logistics, so do not expect a big-match stadium experience",
    ],
  },
};

export default prvaLigaSloveniaStadiums;
