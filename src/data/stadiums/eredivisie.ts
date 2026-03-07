import type { StadiumRecord } from "./types";

const eredivisieStadiums: Record<string, StadiumRecord> = {
  "johan-cruyff-arena": {
    stadiumKey: "johan-cruyff-arena",
    name: "Johan Cruyff Arena",
    city: "Amsterdam",
    country: "Netherlands",
    capacity: 55885,
    opened: 1996,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 19,
    teamKeys: ["ajax"],
    tips: [
      "Large modern stadium in the Amsterdam Zuidoost district",
      "Area has bars and restaurants but city centre pre-match is better",
    ],
    transit: [
      { label: "Amsterdam Bijlmer ArenA (Train + Metro)", minutes: 3 },
      { label: "Strandvliet (Metro)", minutes: 10 },
    ],
    stayAreas: [
      { area: "Amsterdam Centrum", why: "Best nightlife and tourist base" },
      { area: "De Pijp", why: "Lively neighbourhood with bars and restaurants" },
    ],
  },

  "philips-stadion": {
    stadiumKey: "philips-stadion",
    name: "Philips Stadion",
    city: "Eindhoven",
    country: "Netherlands",
    capacity: 35000,
    opened: 1913,
    airport: "Eindhoven Airport (EIN)",
    distanceFromAirportKm: 8,
    teamKeys: ["psv"],
    tips: [
      "Stadium sits right in the city centre",
      "Very easy matchday experience with pubs nearby",
    ],
    transit: [
      { label: "Eindhoven Central Station", minutes: 10 },
      { label: "18 Septemberplein / Centrum", minutes: 8, note: "best city approach" },
    ],
    stayAreas: [
      { area: "Eindhoven City Centre", why: "Everything within walking distance" },
      { area: "Around Central Station", why: "Best practical base for rail and airport access" },
    ],
  },

  "de-kuip": {
    stadiumKey: "de-kuip",
    name: "De Kuip",
    city: "Rotterdam",
    country: "Netherlands",
    capacity: 51177,
    opened: 1937,
    airport: "Rotterdam The Hague Airport (RTM)",
    distanceFromAirportKm: 16,
    teamKeys: ["feyenoord"],
    tips: [
      "One of the most famous stadium atmospheres in Europe",
      "Arrive early to experience the build-up around the ground",
    ],
    transit: [
      { label: "Rotterdam Zuid (Train)", minutes: 15 },
      { label: "Stadion Feyenoord (Tram)", minutes: 5 },
    ],
    stayAreas: [
      { area: "Rotterdam Centrum", why: "Best hotels, restaurants and nightlife" },
      { area: "Witte de With / Cool District", why: "Best city-break feel and evening atmosphere" },
    ],
  },

  "afas-stadion": {
    stadiumKey: "afas-stadion",
    name: "AFAS Stadion",
    city: "Alkmaar",
    country: "Netherlands",
    capacity: 19500,
    opened: 2006,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 43,
    teamKeys: ["az-alkmaar"],
    transit: [
      { label: "Alkmaar Station", minutes: 25 },
      { label: "Alkmaar Centrum", minutes: 20 },
    ],
    stayAreas: [
      { area: "Alkmaar Centre", why: "Best practical local stay with bars and canalside atmosphere" },
      { area: "Amsterdam", why: "Better wider base if combining football with a bigger city break" },
    ],
    tips: [
      "Good smaller-city football trip if you want something more relaxed than Amsterdam",
      "Easy to do from Amsterdam, but staying in Alkmaar gives the match more identity",
    ],
  },

  "de-grolsch-veste": {
    stadiumKey: "de-grolsch-veste",
    name: "De Grolsch Veste",
    city: "Enschede",
    country: "Netherlands",
    capacity: 30205,
    opened: 1998,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 175,
    teamKeys: ["twente"],
    transit: [
      { label: "Enschede Station", minutes: 20 },
      { label: "Enschede Kennispark", minutes: 10, note: "best local rail access" },
    ],
    stayAreas: [
      { area: "Enschede Centre", why: "Best local base with bars and restaurants" },
      { area: "Near Station", why: "Best practical base for rail-based travel" },
    ],
    tips: [
      "One of the stronger non-Randstad football trips in the Netherlands",
      "Best handled as a proper overnight if you do not want a long same-day rail slog",
    ],
  },

  "galgenwaard": {
    stadiumKey: "galgenwaard",
    name: "Stadion Galgenwaard",
    city: "Utrecht",
    country: "Netherlands",
    capacity: 23750,
    opened: 1936,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 49,
    teamKeys: ["utrecht"],
    transit: [
      { label: "Utrecht Centraal", minutes: 20 },
      { label: "City centre / Neude", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best all-round Utrecht base" },
      { area: "Museumkwartier", why: "Best quieter scenic option close to central action" },
    ],
    tips: [
      "Utrecht is one of the most underrated football-weekend cities in the country",
      "Very easy to build a proper city break around this match trip",
    ],
  },

  "gelredome": {
    stadiumKey: "gelredome",
    name: "GelreDome",
    city: "Arnhem",
    country: "Netherlands",
    capacity: 34000,
    opened: 1998,
    airport: "Eindhoven Airport (EIN)",
    distanceFromAirportKm: 92,
    teamKeys: ["vitesse"],
    transit: [
      { label: "Arnhem Centraal", minutes: 20 },
      { label: "City centre", minutes: 20, note: "best practical stay base" },
    ],
    stayAreas: [
      { area: "Arnhem Centre", why: "Best practical local base" },
      { area: "Near Arnhem Centraal", why: "Best if arriving and leaving by rail" },
    ],
    tips: [
      "A coherent enough football trip, though less headline-grabbing than Amsterdam, Rotterdam or Utrecht",
      "Good if combined with a broader eastern Netherlands itinerary",
    ],
  },

  "euroborg": {
    stadiumKey: "euroborg",
    name: "Euroborg",
    city: "Groningen",
    country: "Netherlands",
    capacity: 22579,
    opened: 2006,
    airport: "Groningen Airport Eelde (GRQ)",
    distanceFromAirportKm: 16,
    teamKeys: ["groningen"],
    transit: [
      { label: "Groningen Station", minutes: 20 },
      { label: "City centre / Grote Markt", minutes: 20, note: "best city base" },
    ],
    stayAreas: [
      { area: "Binnenstad", why: "Best overall base for bars, food and nightlife" },
      { area: "Around Grote Markt", why: "Best city atmosphere and walkability" },
    ],
    tips: [
      "One of the best student-city football trips in the league",
      "Groningen is strong enough to justify a proper weekend rather than just a match stop",
    ],
  },

  "abe-lenstra-stadion": {
    stadiumKey: "abe-lenstra-stadion",
    name: "Abe Lenstra Stadion",
    city: "Heerenveen",
    country: "Netherlands",
    capacity: 26100,
    opened: 1994,
    airport: "Groningen Airport Eelde (GRQ)",
    distanceFromAirportKm: 60,
    teamKeys: ["heerenveen"],
    transit: [
      { label: "Heerenveen Station", minutes: 20 },
      { label: "Town centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Heerenveen Centre", why: "Best local practical base" },
      { area: "Leeuwarden", why: "Better wider regional base if combining travel" },
    ],
    tips: [
      "More of a football stop than a major city-break destination",
      "A solid trip for groundhoppers, but lighter on wider city appeal than the bigger Dutch clubs",
    ],
  },

  "goffertstadion": {
    stadiumKey: "goffertstadion",
    name: "Goffertstadion",
    city: "Nijmegen",
    country: "Netherlands",
    capacity: 12500,
    opened: 1939,
    airport: "Eindhoven Airport (EIN)",
    distanceFromAirportKm: 68,
    teamKeys: ["nec-nijmegen"],
    transit: [
      { label: "Nijmegen Station", minutes: 25 },
      { label: "City centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Nijmegen Centre", why: "Best overall local base" },
      { area: "Near Station", why: "Best for practical rail access" },
    ],
    tips: [
      "Pleasant smaller-city football trip with a livelier centre than some expect",
      "Good for a short overnight rather than an extended luxury weekend",
    ],
  },

  "mac3park-stadion": {
    stadiumKey: "mac3park-stadion",
    name: "MAC³PARK Stadion",
    city: "Zwolle",
    country: "Netherlands",
    capacity: 14000,
    opened: 2009,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 120,
    teamKeys: ["pec-zwolle"],
    transit: [
      { label: "Zwolle Station", minutes: 20 },
      { label: "Zwolle Centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Zwolle Centre", why: "Best local practical base with decent food and bars" },
      { area: "Near Station", why: "Best if arriving and leaving by rail" },
    ],
    tips: [
      "Useful, simple football trip rather than a glamour pick",
      "Works best as a neat one-night stop if you want to cover more grounds",
    ],
  },

  "erve-asito": {
    stadiumKey: "erve-asito",
    name: "Erve Asito",
    city: "Almelo",
    country: "Netherlands",
    capacity: 12500,
    opened: 1999,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 165,
    teamKeys: ["heracles"],
    transit: [
      { label: "Almelo Station", minutes: 20 },
      { label: "Town centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Almelo Centre", why: "Simplest local option" },
      { area: "Enschede", why: "Better wider regional base with stronger nightlife" },
    ],
    tips: [
      "More of a functional football stop than a dream city-break",
      "Enschede may be the better overnight base if you want more than just the match",
    ],
  },

  "de-adelaarshorst": {
    stadiumKey: "de-adelaarshorst",
    name: "De Adelaarshorst",
    city: "Deventer",
    country: "Netherlands",
    capacity: 10400,
    opened: 1920,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 120,
    teamKeys: ["go-ahead-eagles"],
    transit: [
      { label: "Deventer Station", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Deventer Centre", why: "Best local base with historic-city feel" },
      { area: "Zwolle", why: "Alternative wider regional base" },
    ],
    tips: [
      "One of the more characterful smaller grounds in the league",
      "Deventer is better than it looks on paper if you like old-town football stops",
    ],
  },

  "spangen": {
    stadiumKey: "spangen",
    name: "Sparta Stadion Het Kasteel",
    city: "Rotterdam",
    country: "Netherlands",
    capacity: 11000,
    opened: 1916,
    airport: "Rotterdam The Hague Airport (RTM)",
    distanceFromAirportKm: 8,
    teamKeys: ["sparta-rotterdam"],
    transit: [
      { label: "Rotterdam Centraal", minutes: 20 },
      { label: "Marconiplein", minutes: 12, note: "best local approach" },
    ],
    stayAreas: [
      { area: "Rotterdam Centrum", why: "Best hotels and city-break base" },
      { area: "Cool District", why: "Best bars and more local central feel" },
    ],
    tips: [
      "Classic old-ground charm makes this one feel different from Feyenoord’s bigger spectacle",
      "Easy to combine with a wider Rotterdam weekend",
    ],
  },

  "fortuna-sittard-stadion": {
    stadiumKey: "fortuna-sittard-stadion",
    name: "Fortuna Sittard Stadion",
    city: "Sittard",
    country: "Netherlands",
    capacity: 12500,
    opened: 1999,
    airport: "Maastricht Aachen Airport (MST)",
    distanceFromAirportKm: 15,
    teamKeys: ["fortuna-sittard"],
    transit: [
      { label: "Sittard Station", minutes: 20 },
      { label: "Town centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Sittard Centre", why: "Most practical local base" },
      { area: "Maastricht", why: "Better city-break choice with stronger food and nightlife" },
    ],
    tips: [
      "Usually better as a Maastricht-based football trip than a pure Sittard weekend",
      "Useful if combining football with a southern Netherlands / border-region trip",
    ],
  },

  "mandemakers-stadion": {
    stadiumKey: "mandemakers-stadion",
    name: "Mandemakers Stadion",
    city: "Waalwijk",
    country: "Netherlands",
    capacity: 7500,
    opened: 1996,
    airport: "Eindhoven Airport (EIN)",
    distanceFromAirportKm: 42,
    teamKeys: ["rkc-waalwijk"],
    transit: [
      { label: "Waalwijk Centre", minutes: 15 },
      { label: "Tilburg", minutes: 25, note: "better wider nearby base" },
    ],
    stayAreas: [
      { area: "Waalwijk Centre", why: "Simplest local option" },
      { area: "Tilburg", why: "Better city atmosphere and broader hotel choice" },
    ],
    tips: [
      "A smaller, more functional football stop than a classic glamour away trip",
      "Best handled as part of wider Brabant travel rather than as a stand-alone luxury weekend",
    ],
  },

  "kras-stadion": {
    stadiumKey: "kras-stadion",
    name: "Kras Stadion",
    city: "Volendam",
    country: "Netherlands",
    capacity: 7384,
    opened: 1975,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 38,
    teamKeys: ["volendam"],
    transit: [
      { label: "Amsterdam Centraal", minutes: 35, note: "best wider arrival base" },
      { label: "Volendam Centre", minutes: 10 },
    ],
    stayAreas: [
      { area: "Volendam", why: "Best if you want the full local fishing-town feel" },
      { area: "Amsterdam", why: "Best wider city-break base if combining football with a major trip" },
    ],
    tips: [
      "Very different feel from the big Dutch city clubs and best if you lean into the local setting",
      "Easy to do as a side trip from Amsterdam",
    ],
  },

  "yanmar-stadion": {
    stadiumKey: "yanmar-stadion",
    name: "Yanmar Stadion",
    city: "Almere",
    country: "Netherlands",
    capacity: 4500,
    opened: 2005,
    airport: "Amsterdam Schiphol Airport (AMS)",
    distanceFromAirportKm: 39,
    teamKeys: ["almere-city"],
    transit: [
      { label: "Almere Centrum", minutes: 20 },
      { label: "Amsterdam Centraal", minutes: 40, note: "better wider city base" },
    ],
    stayAreas: [
      { area: "Almere Centrum", why: "Most practical local base" },
      { area: "Amsterdam", why: "Much better city-break base with easy onward travel" },
    ],
    tips: [
      "More of a modern practical trip than a romantic football destination",
      "Amsterdam often remains the smarter overnight base if you are not staying purely for convenience",
    ],
  },
};

export default eredivisieStadiums;
