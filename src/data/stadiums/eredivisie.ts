// src/data/stadiums/eredivisie.ts
import type { StadiumRecord } from "./types";

const NETHERLANDS = "Netherlands";

export const eredivisieStadiums: Record<string, StadiumRecord> = {
  "johan-cruyff-arena": {
    stadiumKey: "johan-cruyff-arena",
    name: "Johan Cruyff Arena",
    city: "Amsterdam",
    country: NETHERLANDS,
    capacity: 55885,
    opened: 1996,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 19,
    teamKeys: ["ajax"],
    tips: [
      "Large modern stadium in Amsterdam Zuidoost with easy rail and metro access",
      "City-centre Amsterdam is usually the better pre-match and overnight base than staying by the ground",
    ],
    transit: [
      { label: "Amsterdam Bijlmer ArenA", minutes: 3, note: "best rail and metro access point" },
      { label: "Strandvliet", minutes: 10, note: "useful metro approach on foot" },
    ],
    stayAreas: [
      { area: "Amsterdam Centrum", why: "Best nightlife, visitor energy and overall city-break base" },
      { area: "De Pijp", why: "Great bars, food and a stronger neighbourhood feel" },
    ],
  },

  "philips-stadion": {
    stadiumKey: "philips-stadion",
    name: "Philips Stadion",
    city: "Eindhoven",
    country: NETHERLANDS,
    capacity: 35000,
    opened: 1913,
    airport: "Eindhoven Airport (EIN)",
    distanceFromAirportKm: 8,
    teamKeys: ["psv"],
    tips: [
      "One of the easiest city-centre stadium trips in Europe",
      "Perfect for a low-friction football weekend because the ground sits right in the city fabric",
    ],
    transit: [
      { label: "Eindhoven Central Station", minutes: 10, note: "best rail hub" },
      { label: "18 Septemberplein / Centrum", minutes: 8, note: "best city-centre approach" },
    ],
    stayAreas: [
      { area: "Eindhoven City Centre", why: "Everything important is within walking distance" },
      { area: "Around Central Station", why: "Best practical base for airport and rail access" },
    ],
  },

  "de-kuip": {
    stadiumKey: "de-kuip",
    name: "De Kuip",
    city: "Rotterdam",
    country: NETHERLANDS,
    capacity: 51177,
    opened: 1937,
    airport: "Rotterdam The Hague Airport (RTM)",
    distanceFromAirportKm: 16,
    teamKeys: ["feyenoord"],
    tips: [
      "One of Europe’s great classic big-match stadiums",
      "Arrive early because the build-up is a big part of why this trip matters",
    ],
    transit: [
      { label: "Rotterdam Zuid", minutes: 15, note: "best rail-linked base nearby" },
      { label: "Stadion Feyenoord", minutes: 5, note: "best tram stop for the ground" },
    ],
    stayAreas: [
      { area: "Rotterdam Centrum", why: "Best hotels, food and nightlife for a full city break" },
      { area: "Witte de With / Cool District", why: "Best central evening atmosphere and bar scene" },
    ],
  },

  "afas-stadion": {
    stadiumKey: "afas-stadion",
    name: "AFAS Stadion",
    city: "Alkmaar",
    country: NETHERLANDS,
    capacity: 19500,
    opened: 2006,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 43,
    teamKeys: ["az-alkmaar"],
    transit: [
      { label: "Alkmaar Station", minutes: 25, note: "best rail arrival point" },
      { label: "Alkmaar Centrum", minutes: 20, note: "best city base" },
    ],
    stayAreas: [
      { area: "Alkmaar Centre", why: "Best local stay with bars, canals and easy matchday movement" },
      { area: "Amsterdam", why: "Better wider city-break base if combining football with a bigger trip" },
    ],
    tips: [
      "Good smaller-city football weekend if you want something calmer than Amsterdam",
      "Alkmaar is worth staying in if you want the match to feel like the centre of the trip",
    ],
  },

  "de-grolsch-veste": {
    stadiumKey: "de-grolsch-veste",
    name: "De Grolsch Veste",
    city: "Enschede",
    country: NETHERLANDS,
    capacity: 30205,
    opened: 1998,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 175,
    teamKeys: ["twente"],
    transit: [
      { label: "Enschede Station", minutes: 20, note: "best central rail base" },
      { label: "Enschede Kennispark", minutes: 10, note: "best local train stop for the stadium" },
    ],
    stayAreas: [
      { area: "Enschede Centre", why: "Best local base for bars, food and matchday practicality" },
      { area: "Near Station", why: "Best if rail convenience matters most" },
    ],
    tips: [
      "One of the strongest non-Randstad football trips in the country",
      "Best handled as a real overnight rather than a same-day rail slog",
    ],
  },

  "galgenwaard": {
    stadiumKey: "galgenwaard",
    name: "Stadion Galgenwaard",
    city: "Utrecht",
    country: NETHERLANDS,
    capacity: 23750,
    opened: 1936,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 49,
    teamKeys: ["utrecht"],
    transit: [
      { label: "Utrecht Centraal", minutes: 20, note: "best rail hub" },
      { label: "City centre / Neude", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best all-round Utrecht football-weekend base" },
      { area: "Museumkwartier", why: "Best quieter scenic option near the centre" },
    ],
    tips: [
      "Utrecht is one of the most underrated football weekends in the Netherlands",
      "Very easy to combine a proper city break with the football here",
    ],
  },

  "euroborg": {
    stadiumKey: "euroborg",
    name: "Euroborg",
    city: "Groningen",
    country: NETHERLANDS,
    capacity: 22579,
    opened: 2006,
    airport: "Groningen Airport Eelde (GRQ)",
    distanceFromAirportKm: 16,
    teamKeys: ["groningen"],
    transit: [
      { label: "Groningen Station", minutes: 20, note: "best rail base" },
      { label: "City centre / Grote Markt", minutes: 20, note: "best nightlife and stay area" },
    ],
    stayAreas: [
      { area: "Binnenstad", why: "Best overall base for bars, food and nightlife" },
      { area: "Around Grote Markt", why: "Best city atmosphere and walkability" },
    ],
    tips: [
      "One of the best student-city football trips in the league",
      "Strong enough city to justify a proper weekend rather than just a match stop",
    ],
  },

  "abe-lenstra-stadion": {
    stadiumKey: "abe-lenstra-stadion",
    name: "Abe Lenstra Stadion",
    city: "Heerenveen",
    country: NETHERLANDS,
    capacity: 26100,
    opened: 1994,
    airport: "Groningen Airport Eelde (GRQ)",
    distanceFromAirportKm: 60,
    teamKeys: ["heerenveen"],
    transit: [
      { label: "Heerenveen Station", minutes: 20, note: "best rail anchor" },
      { label: "Town centre", minutes: 15, note: "best local base" },
    ],
    stayAreas: [
      { area: "Heerenveen Centre", why: "Best practical local base" },
      { area: "Leeuwarden", why: "Better wider regional base if extending the trip" },
    ],
    tips: [
      "More of a football stop than a major city-break destination",
      "Solid for groundhoppers, but lighter on wider-city appeal than the bigger Dutch clubs",
    ],
  },

  "goffertstadion": {
    stadiumKey: "goffertstadion",
    name: "Goffertstadion",
    city: "Nijmegen",
    country: NETHERLANDS,
    capacity: 12500,
    opened: 1939,
    airport: "Eindhoven Airport (EIN)",
    distanceFromAirportKm: 68,
    teamKeys: ["nec-nijmegen"],
    transit: [
      { label: "Nijmegen Station", minutes: 25, note: "best mainline arrival point" },
      { label: "City centre", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Nijmegen Centre", why: "Best all-round local base" },
      { area: "Near Station", why: "Best for practical rail-based trips" },
    ],
    tips: [
      "Pleasant football city with more life than outsiders sometimes expect",
      "Good for a short overnight instead of a rushed in-and-out day trip",
    ],
  },

  "mac3park-stadion": {
    stadiumKey: "mac3park-stadion",
    name: "MAC³PARK Stadion",
    city: "Zwolle",
    country: NETHERLANDS,
    capacity: 14000,
    opened: 2009,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 120,
    teamKeys: ["pec-zwolle"],
    transit: [
      { label: "Zwolle Station", minutes: 20, note: "best rail arrival point" },
      { label: "Zwolle Centre", minutes: 20, note: "best local base" },
    ],
    stayAreas: [
      { area: "Zwolle Centre", why: "Best practical base with good bars and food" },
      { area: "Near Station", why: "Best if rail convenience matters most" },
    ],
    tips: [
      "Useful neat football trip rather than a glamour weekend",
      "Works best as a simple one-night stop if you are covering multiple grounds",
    ],
  },

  "erve-asito": {
    stadiumKey: "erve-asito",
    name: "Erve Asito",
    city: "Almelo",
    country: NETHERLANDS,
    capacity: 12500,
    opened: 1999,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 165,
    teamKeys: ["heracles"],
    transit: [
      { label: "Almelo Station", minutes: 20, note: "best local rail hub" },
      { label: "Town centre", minutes: 15, note: "best local base" },
    ],
    stayAreas: [
      { area: "Almelo Centre", why: "Simplest local option for the match" },
      { area: "Enschede", why: "Better wider regional base with stronger nightlife" },
    ],
    tips: [
      "More of a functional football stop than a dream city-break",
      "Enschede is often the better overnight base if you want more than just the match",
    ],
  },

  "de-adelaarshorst": {
    stadiumKey: "de-adelaarshorst",
    name: "De Adelaarshorst",
    city: "Deventer",
    country: NETHERLANDS,
    capacity: 10400,
    opened: 1920,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 120,
    teamKeys: ["go-ahead-eagles"],
    transit: [
      { label: "Deventer Station", minutes: 20, note: "best rail arrival point" },
      { label: "City centre", minutes: 15, note: "best local stay base" },
    ],
    stayAreas: [
      { area: "Deventer Centre", why: "Best local base with historic-city feel" },
      { area: "Zwolle", why: "Alternative wider regional base" },
    ],
    tips: [
      "One of the most characterful smaller grounds in the league",
      "Deventer is better than it looks on paper if you like old-town football stops",
    ],
  },

  "spangen": {
    stadiumKey: "spangen",
    name: "Sparta Stadion Het Kasteel",
    city: "Rotterdam",
    country: NETHERLANDS,
    capacity: 11000,
    opened: 1916,
    airport: "Rotterdam The Hague Airport (RTM)",
    distanceFromAirportKm: 8,
    teamKeys: ["sparta-rotterdam"],
    transit: [
      { label: "Rotterdam Centraal", minutes: 20, note: "best central rail base" },
      { label: "Marconiplein", minutes: 12, note: "best local tram/metro approach" },
    ],
    stayAreas: [
      { area: "Rotterdam Centrum", why: "Best hotels and overall city-break base" },
      { area: "Cool District", why: "Best bars and more local central feel" },
    ],
    tips: [
      "Classic old-ground charm makes this feel very different from Feyenoord’s larger spectacle",
      "Easy to combine with a wider Rotterdam football weekend",
    ],
  },

  "fortuna-sittard-stadion": {
    stadiumKey: "fortuna-sittard-stadion",
    name: "Fortuna Sittard Stadion",
    city: "Sittard",
    country: NETHERLANDS,
    capacity: 12500,
    opened: 1999,
    airport: "Maastricht Aachen Airport (MST)",
    distanceFromAirportKm: 15,
    teamKeys: ["fortuna-sittard"],
    transit: [
      { label: "Sittard Station", minutes: 20, note: "best rail base" },
      { label: "Town centre", minutes: 15, note: "best local anchor" },
    ],
    stayAreas: [
      { area: "Sittard Centre", why: "Most practical local base" },
      { area: "Maastricht", why: "Better city-break choice with stronger food and nightlife" },
    ],
    tips: [
      "Usually better as a Maastricht-based football trip than a pure Sittard weekend",
      "Useful if combining football with a southern Netherlands or border-region trip",
    ],
  },

  "kras-stadion": {
    stadiumKey: "kras-stadion",
    name: "Kras Stadion",
    city: "Volendam",
    country: NETHERLANDS,
    capacity: 7384,
    opened: 1975,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 38,
    teamKeys: ["volendam"],
    transit: [
      { label: "Amsterdam Centraal", minutes: 35, note: "best wider arrival base" },
      { label: "Volendam Centre", minutes: 10, note: "best local base" },
    ],
    stayAreas: [
      { area: "Volendam", why: "Best if you want the full local fishing-town feel" },
      { area: "Amsterdam", why: "Best wider city-break base if combining football with a major trip" },
    ],
    tips: [
      "Very different feel from the major Dutch city clubs and best if you lean into the local setting",
      "Easy to do as a side trip from Amsterdam",
    ],
  },

  "rat-verlegh-stadion": {
    stadiumKey: "rat-verlegh-stadion",
    name: "Rat Verlegh Stadion",
    city: "Breda",
    country: NETHERLANDS,
    capacity: 20500,
    opened: 1996,
    airport: "Rotterdam The Hague Airport (RTM)",
    distanceFromAirportKm: 58,
    teamKeys: ["nac-breda"],
    transit: [
      { label: "Breda Station", minutes: 20, note: "best rail arrival point" },
      { label: "Breda Centre", minutes: 20, note: "best wider visitor base" },
    ],
    stayAreas: [
      { area: "Breda Centre", why: "Best all-round base for bars, food and overall city feel" },
      { area: "Near Station", why: "Best for practical rail-led trips" },
    ],
    tips: [
      "One of the stronger football-culture stops in the Netherlands outside the biggest clubs",
      "Breda is a very good football weekend if you keep it compact and pub-led",
    ],
  },

  "van-donge-de-roo-stadion": {
    stadiumKey: "van-donge-de-roo-stadion",
    name: "Van Donge & De Roo Stadion",
    city: "Rotterdam",
    country: NETHERLANDS,
    capacity: 4400,
    opened: 1902,
    airport: "Rotterdam The Hague Airport (RTM)",
    distanceFromAirportKm: 8,
    teamKeys: ["excelsior"],
    transit: [
      { label: "Rotterdam Centraal", minutes: 20, note: "best wider city base" },
      { label: "Kralingse Zoom", minutes: 15, note: "best metro-linked approach" },
    ],
    stayAreas: [
      { area: "Rotterdam Centrum", why: "Best overall hotel and nightlife base" },
      { area: "Kralingen", why: "Best if you want a smarter local neighbourhood feel closer to the ground" },
    ],
    tips: [
      "Much smaller and more intimate than Feyenoord or Sparta, so this is a different kind of Rotterdam football trip",
      "Best treated as a Rotterdam weekend first and an Excelsior match second",
    ],
  },

  "711-stadion": {
    stadiumKey: "711-stadion",
    name: "711 Stadion",
    city: "Velsen-Zuid",
    country: NETHERLANDS,
    capacity: 3060,
    opened: 1948,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 27,
    teamKeys: ["telstar"],
    transit: [
      { label: "Driehuis Station", minutes: 20, note: "best nearby rail option" },
      { label: "Haarlem", minutes: 25, note: "best wider stay base" },
    ],
    stayAreas: [
      { area: "Haarlem Centre", why: "Best overall base with better bars, restaurants and hotel choice" },
      { area: "IJmuiden / Velsen area", why: "Closest practical option if you only care about convenience" },
    ],
    tips: [
      "Very much a smaller-ground football stop rather than a major city-break spectacle",
      "Haarlem is usually the smarter overnight base unless you want the most direct possible trip",
    ],
  },
};

export default eredivisieStadiums;
