import type { StadiumRecord } from "./types";

const austrianBundesligaStadiums: Record<string, StadiumRecord> = {
  "red-bull-arena-salzburg": {
    stadiumKey: "red-bull-arena-salzburg",
    name: "Red Bull Arena",
    city: "Salzburg",
    country: "Austria",
    capacity: 31895,
    opened: 2003,
    airport: "Salzburg Airport (SZG)",
    distanceFromAirportKm: 8,
    teamKeys: ["red-bull-salzburg"],
    tips: [
      "Modern stadium with very easy suburban access",
      "Salzburg old town is the best visitor base, not the stadium area itself",
    ],
    transit: [
      { label: "Salzburg Hbf", minutes: 25, note: "Bus/tram connection needed" },
      { label: "City centre / Altstadt", minutes: 25, note: "easy bus-based approach" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best overall base for sightseeing, food and atmosphere" },
      { area: "Near Salzburg Hbf", why: "Best for quick onward travel" },
    ],
  },

  "allianz-stadion-vienna": {
    stadiumKey: "allianz-stadion-vienna",
    name: "Allianz Stadion",
    city: "Vienna",
    country: "Austria",
    capacity: 28000,
    opened: 2016,
    airport: "Vienna International Airport (VIE)",
    distanceFromAirportKm: 34,
    teamKeys: ["rapid-vienna"],
    tips: [
      "Best Austrian trip for atmosphere outside Salzburg",
      "Use Vienna city centre as your base rather than staying near the ground",
    ],
    transit: [
      { label: "Hütteldorf", minutes: 10 },
      { label: "Wien Westbahnhof", minutes: 25, note: "good city access by U-Bahn/S-Bahn" },
    ],
    stayAreas: [
      { area: "Innere Stadt", why: "Best classic Vienna base" },
      { area: "Neubau", why: "Great bars, food and transport" },
    ],
  },

  "generali-arena": {
    stadiumKey: "generali-arena",
    name: "Generali Arena",
    city: "Vienna",
    country: "Austria",
    capacity: 17000,
    opened: 1925,
    airport: "Vienna International Airport (VIE)",
    distanceFromAirportKm: 18,
    teamKeys: ["austria-vienna"],
    tips: [
      "Easy stadium to combine with a wider Vienna city break",
      "Vienna centre is a much better base than the immediate stadium surroundings",
    ],
    transit: [
      { label: "Altes Landgut", minutes: 8 },
      { label: "Wien Hauptbahnhof", minutes: 20, note: "best rail hub for most visitors" },
    ],
    stayAreas: [
      { area: "Innere Stadt", why: "Best all-round Vienna stay" },
      { area: "Wieden / Hauptbahnhof", why: "Best practical access for rail and stadium travel" },
    ],
  },

  "merkur-arena-graz": {
    stadiumKey: "merkur-arena-graz",
    name: "Merkur Arena",
    city: "Graz",
    country: "Austria",
    capacity: 16764,
    opened: 1997,
    airport: "Graz Airport (GRZ)",
    distanceFromAirportKm: 9,
    teamKeys: ["sturm-graz", "grazer-ak"],
    tips: [
      "Graz is a very good underrated football weekend city",
      "Use the old town as your base and travel out rather than staying near the ground",
    ],
    transit: [
      { label: "Graz Hbf", minutes: 20 },
      { label: "Jakominiplatz", minutes: 18, note: "key city tram interchange" },
    ],
    stayAreas: [
      { area: "Graz Old Town", why: "Best base for food, bars and city atmosphere" },
      { area: "Around Jakominiplatz", why: "Strong transport base with easy tram access" },
    ],
  },

  "raiffeisen-arena-linz": {
    stadiumKey: "raiffeisen-arena-linz",
    name: "Raiffeisen Arena",
    city: "Linz",
    country: "Austria",
    capacity: 19080,
    opened: 2023,
    airport: "Linz Airport (LNZ)",
    distanceFromAirportKm: 12,
    teamKeys: ["lask"],
    tips: [
      "Modern stadium and one of the cleaner football trips in Austria",
      "Central Linz works better than staying by the stadium",
    ],
    transit: [
      { label: "Linz Hbf", minutes: 20 },
      { label: "City centre / Landstraße", minutes: 18, note: "best practical visitor base" },
    ],
    stayAreas: [
      { area: "Linz City Centre", why: "Best balance of hotels, food and transport" },
      { area: "Near Linz Hbf", why: "Best for fast onward rail travel" },
    ],
  },

  "lavanttal-arena": {
    stadiumKey: "lavanttal-arena",
    name: "Lavanttal Arena",
    city: "Wolfsberg",
    country: "Austria",
    capacity: 7300,
    opened: 1984,
    airport: "Klagenfurt Airport (KLU)",
    distanceFromAirportKm: 62,
    teamKeys: ["wolfsberger"],
    tips: [
      "More of a football stop than a classic city-break destination",
      "Best done with a car or as part of a wider Austria trip",
    ],
    transit: [
      { label: "Wolfsberg Station", minutes: 25 },
      { label: "Town centre", minutes: 18 },
    ],
    stayAreas: [
      { area: "Wolfsberg Town Centre", why: "Simplest local base if staying overnight" },
      { area: "Klagenfurt", why: "Stronger visitor base if combining with wider travel" },
    ],
  },

  "profertil-arena-hartberg": {
    stadiumKey: "profertil-arena-hartberg",
    name: "Profertil Arena Hartberg",
    city: "Hartberg",
    country: "Austria",
    capacity: 4500,
    opened: 1996,
    airport: "Graz Airport (GRZ)",
    distanceFromAirportKm: 74,
    teamKeys: ["hartberg"],
    tips: [
      "Small-ground trip rather than a headline football weekend",
      "Better suited to car-based travel than pure public transport planning",
    ],
    transit: [
      { label: "Hartberg town centre", minutes: 12 },
      { label: "Hartberg bus station", minutes: 15, note: "best local arrival point" },
    ],
    stayAreas: [
      { area: "Hartberg Centre", why: "Most practical local base" },
      { area: "Graz", why: "Better city-break option if not staying purely for the match" },
    ],
  },

  "hofmann-personal-stadion": {
    stadiumKey: "hofmann-personal-stadion",
    name: "Hofmann Personal Stadion",
    city: "Linz",
    country: "Austria",
    capacity: 5595,
    opened: 1952,
    airport: "Linz Airport (LNZ)",
    distanceFromAirportKm: 14,
    teamKeys: ["bw-linz"],
    tips: [
      "Smaller, more low-key football experience than LASK",
      "Linz city centre remains the best base by far",
    ],
    transit: [
      { label: "Linz Hbf", minutes: 20 },
      { label: "Linz city centre", minutes: 18 },
    ],
    stayAreas: [
      { area: "Linz City Centre", why: "Best hotels, restaurants and visitor convenience" },
      { area: "Near Linz Hbf", why: "Best practical rail-based option" },
    ],
  },

  "cashpoint-arena": {
    stadiumKey: "cashpoint-arena",
    name: "Cashpoint Arena",
    city: "Altach",
    country: "Austria",
    capacity: 8500,
    opened: 1990,
    airport: "St. Gallen–Altenrhein Airport (ACH)",
    distanceFromAirportKm: 12,
    teamKeys: ["altach"],
    tips: [
      "Very regional trip and more niche than the bigger Austrian cities",
      "Useful if combining football with Lake Constance or Alpine travel",
    ],
    transit: [
      { label: "Altach Station", minutes: 20 },
      { label: "Bregenz", minutes: 30, note: "better wider base on the lake" },
    ],
    stayAreas: [
      { area: "Bregenz", why: "Best nearby visitor base with more hotel choice" },
      { area: "Altach", why: "Closest practical option if keeping it simple" },
    ],
  },

  "tivoli-stadion-tirol": {
    stadiumKey: "tivoli-stadion-tirol",
    name: "Tivoli Stadion Tirol",
    city: "Innsbruck",
    country: "Austria",
    capacity: 17000,
    opened: 2000,
    airport: "Innsbruck Airport (INN)",
    distanceFromAirportKm: 7,
    teamKeys: ["tirol"],
    tips: [
      "Excellent football trip if you want mountains and city-break value together",
      "Stay central Innsbruck, not around the ground",
    ],
    transit: [
      { label: "Innsbruck Hbf", minutes: 20 },
      { label: "City centre / Altstadt", minutes: 20, note: "tram/bus based access" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best atmosphere and visitor experience" },
      { area: "Near Innsbruck Hbf", why: "Best for rail access and practical movement" },
    ],
  },

  "worthersee-stadion": {
  "josko-arena": {
  stadiumKey: "josko-arena",
  name: "Josko Arena",
  city: "Ried im Innkreis",
  country: "Austria",
  capacity: 7680,
  opened: 2003,
  airport: "Linz Airport (LNZ)",
  distanceFromAirportKm: 62,
  teamKeys: ["ried"],
  tips: [
    "Compact provincial football stop rather than a major city-break destination",
    "Best done as a simple overnight or as part of a wider Upper Austria route",
  ],
  transit: [
    { label: "Ried im Innkreis station", minutes: 20 },
    { label: "Town centre", minutes: 15, note: "best practical local base" },
  ],
  stayAreas: [
    { area: "Ried im Innkreis Centre", why: "Most practical local base" },
    { area: "Linz", why: "Better wider base if combining football with a larger city stay" },
  ],
},
};

export default austrianBundesligaStadiums;
