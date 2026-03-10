import type { StadiumRecord } from "./types";

const AUSTRIA = "Austria";

const austrianBundesligaStadiums: Record<string, StadiumRecord> = {
  "red-bull-arena-salzburg": {
    stadiumKey: "red-bull-arena-salzburg",
    name: "Red Bull Arena",
    city: "Salzburg",
    country: AUSTRIA,
    capacity: 31895,
    opened: 2003,
    airport: "Salzburg Airport (SZG)",
    distanceFromAirportKm: 8,
    teamKeys: ["red-bull-salzburg"],
    tips: [
      "Modern stadium with straightforward suburban access from the city",
      "Salzburg old town is the best visitor base by far, not the immediate stadium area",
    ],
    transit: [
      { label: "Salzburg Hbf", minutes: 25, note: "best rail anchor with onward local connection" },
      { label: "City centre / Altstadt", minutes: 25, note: "easy bus-based approach from the main visitor core" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best overall base for sightseeing, food and city atmosphere" },
      { area: "Near Salzburg Hbf", why: "Best practical base for rail connections and short stays" },
    ],
    officialInfoUrl: "https://www.redbullsalzburg.at/",
  },

  "allianz-stadion-vienna": {
    stadiumKey: "allianz-stadion-vienna",
    name: "Allianz Stadion",
    city: "Vienna",
    country: AUSTRIA,
    capacity: 28000,
    opened: 2016,
    airport: "Vienna International Airport (VIE)",
    distanceFromAirportKm: 34,
    teamKeys: ["rapid-vienna"],
    tips: [
      "One of the strongest atmosphere-led football trips in Austria",
      "Use central Vienna as your base rather than wasting the stay around the ground",
    ],
    transit: [
      { label: "Hütteldorf", minutes: 10, note: "best immediate transport anchor" },
      { label: "Wien Westbahnhof", minutes: 25, note: "best wider city access point for most visitors" },
    ],
    stayAreas: [
      { area: "Innere Stadt", why: "Best classic Vienna base for a full city-break feel" },
      { area: "Neubau", why: "Strong food, bar and transport balance for a smarter weekend base" },
    ],
    officialInfoUrl: "https://www.skrapid.at/",
  },

  "generali-arena": {
    stadiumKey: "generali-arena",
    name: "Generali Arena",
    city: "Vienna",
    country: AUSTRIA,
    capacity: 17000,
    opened: 1925,
    airport: "Vienna International Airport (VIE)",
    distanceFromAirportKm: 18,
    teamKeys: ["austria-vienna"],
    tips: [
      "Easy stadium to fold into a wider Vienna football weekend",
      "Vienna centre is a much stronger base than the immediate stadium surroundings",
    ],
    transit: [
      { label: "Altes Landgut", minutes: 8, note: "best nearby access point" },
      { label: "Wien Hauptbahnhof", minutes: 20, note: "best major rail hub for most visitors" },
    ],
    stayAreas: [
      { area: "Innere Stadt", why: "Best all-round Vienna stay for first-time visitors" },
      { area: "Wieden / Hauptbahnhof", why: "Best practical balance of rail and stadium access" },
    ],
    officialInfoUrl: "https://www.fk-austria.at/",
  },

  "merkur-arena-graz": {
    stadiumKey: "merkur-arena-graz",
    name: "Merkur Arena",
    city: "Graz",
    country: AUSTRIA,
    capacity: 16764,
    opened: 1997,
    airport: "Graz Airport (GRZ)",
    distanceFromAirportKm: 9,
    teamKeys: ["sturm-graz", "grazer-ak"],
    tips: [
      "Graz is one of the best underrated football weekends in Austria",
      "Stay in the old town and travel out rather than staying near the ground",
    ],
    transit: [
      { label: "Graz Hbf", minutes: 20, note: "best mainline rail anchor" },
      { label: "Jakominiplatz", minutes: 18, note: "key tram interchange for central-city visitors" },
    ],
    stayAreas: [
      { area: "Graz Old Town", why: "Best base for atmosphere, food and overall city quality" },
      { area: "Around Jakominiplatz", why: "Strong transport-led base with easy tram movement" },
    ],
    officialInfoUrl: "https://sksturm.at/",
  },

  "raiffeisen-arena-linz": {
    stadiumKey: "raiffeisen-arena-linz",
    name: "Raiffeisen Arena",
    city: "Linz",
    country: AUSTRIA,
    capacity: 19080,
    opened: 2023,
    airport: "Linz Airport (LNZ)",
    distanceFromAirportKm: 12,
    teamKeys: ["lask"],
    tips: [
      "Modern stadium and one of the cleaner football trips in Austria",
      "Central Linz works better than staying around the stadium zone",
    ],
    transit: [
      { label: "Linz Hbf", minutes: 20, note: "best rail arrival point for most visitors" },
      { label: "City centre / Landstraße", minutes: 18, note: "best practical visitor base" },
    ],
    stayAreas: [
      { area: "Linz City Centre", why: "Best balance of hotels, food and transport access" },
      { area: "Near Linz Hbf", why: "Best practical option for quick rail-based trips" },
    ],
    officialInfoUrl: "https://www.lask.at/",
  },

  "lavanttal-arena": {
    stadiumKey: "lavanttal-arena",
    name: "Lavanttal Arena",
    city: "Wolfsberg",
    country: AUSTRIA,
    capacity: 7300,
    opened: 1984,
    airport: "Klagenfurt Airport (KLU)",
    distanceFromAirportKm: 62,
    teamKeys: ["wolfsberger"],
    tips: [
      "More of a football stop than a classic city-break destination",
      "Best handled with realistic planning or as part of a wider Austria route",
    ],
    transit: [
      { label: "Wolfsberg Station", minutes: 25, note: "best local rail anchor if arriving without a car" },
      { label: "Town centre", minutes: 18, note: "best simple local base" },
    ],
    stayAreas: [
      { area: "Wolfsberg Town Centre", why: "Simplest local base if staying overnight" },
      { area: "Klagenfurt", why: "Stronger wider base if combining football with broader travel" },
    ],
    officialInfoUrl: "https://www.rzpelletswac.at/",
  },

  "profertil-arena-hartberg": {
    stadiumKey: "profertil-arena-hartberg",
    name: "Profertil Arena Hartberg",
    city: "Hartberg",
    country: AUSTRIA,
    capacity: 4500,
    opened: 1996,
    airport: "Graz Airport (GRZ)",
    distanceFromAirportKm: 74,
    teamKeys: ["hartberg"],
    tips: [
      "Small-ground trip rather than a headline football weekend",
      "Better suited to practical routing than overcomplicated public-transport optimism",
    ],
    transit: [
      { label: "Hartberg town centre", minutes: 12, note: "best nearby base" },
      { label: "Hartberg bus station", minutes: 15, note: "best local public-transport arrival point" },
    ],
    stayAreas: [
      { area: "Hartberg Centre", why: "Most practical local base for a football-first overnight" },
      { area: "Graz", why: "Better wider city-break base if not staying purely for the match" },
    ],
    officialInfoUrl: "https://www.tsv-hartberg-fussball.at/",
  },

  "hofmann-personal-stadion": {
    stadiumKey: "hofmann-personal-stadion",
    name: "Hofmann Personal Stadion",
    city: "Linz",
    country: AUSTRIA,
    capacity: 5595,
    opened: 1952,
    airport: "Linz Airport (LNZ)",
    distanceFromAirportKm: 14,
    teamKeys: ["bw-linz"],
    tips: [
      "Smaller, more low-key football experience than LASK",
      "Linz city centre remains the best stay base by a distance",
    ],
    transit: [
      { label: "Linz Hbf", minutes: 20, note: "best rail anchor" },
      { label: "Linz city centre", minutes: 18, note: "best practical visitor base" },
    ],
    stayAreas: [
      { area: "Linz City Centre", why: "Best hotels, restaurants and overall visitor convenience" },
      { area: "Near Linz Hbf", why: "Best practical rail-based option" },
    ],
    officialInfoUrl: "https://blauweiss-linz.at/",
  },

  "cashpoint-arena": {
    stadiumKey: "cashpoint-arena",
    name: "Cashpoint Arena",
    city: "Altach",
    country: AUSTRIA,
    capacity: 8500,
    opened: 1990,
    airport: "St. Gallen–Altenrhein Airport (ACH)",
    distanceFromAirportKm: 12,
    teamKeys: ["altach"],
    tips: [
      "A very regional trip and more niche than the bigger Austrian cities",
      "Works best when combined with Lake Constance or wider western-Austria travel",
    ],
    transit: [
      { label: "Altach Station", minutes: 20, note: "best local rail anchor" },
      { label: "Bregenz", minutes: 30, note: "better wider visitor base on the lake" },
    ],
    stayAreas: [
      { area: "Bregenz", why: "Best nearby visitor base with stronger hotel and food options" },
      { area: "Altach", why: "Closest practical option if keeping the trip simple" },
    ],
    officialInfoUrl: "https://www.scra.at/",
  },

  "tivoli-stadion-tirol": {
    stadiumKey: "tivoli-stadion-tirol",
    name: "Tivoli Stadion Tirol",
    city: "Innsbruck",
    country: AUSTRIA,
    capacity: 17000,
    opened: 2000,
    airport: "Innsbruck Airport (INN)",
    distanceFromAirportKm: 7,
    teamKeys: ["tirol"],
    tips: [
      "Excellent football trip if you want mountains and city-break value together",
      "Stay in central Innsbruck rather than around the ground",
    ],
    transit: [
      { label: "Innsbruck Hbf", minutes: 20, note: "best rail anchor" },
      { label: "City centre / Altstadt", minutes: 20, note: "easy tram or bus-based access" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best atmosphere and strongest visitor experience" },
      { area: "Near Innsbruck Hbf", why: "Best practical base for rail links and movement" },
    ],
    officialInfoUrl: "https://www.wsg-fussball.at/",
  },

  "josko-arena": {
    stadiumKey: "josko-arena",
    name: "Josko Arena",
    city: "Ried im Innkreis",
    country: AUSTRIA,
    capacity: 7680,
    opened: 2003,
    airport: "Linz Airport (LNZ)",
    distanceFromAirportKm: 62,
    teamKeys: ["ried"],
    tips: [
      "Compact provincial football stop rather than a major city-break destination",
      "Best done as a simple overnight or inside a wider Upper Austria route",
    ],
    transit: [
      { label: "Ried im Innkreis station", minutes: 20, note: "best rail arrival point" },
      { label: "Town centre", minutes: 15, note: "best practical local base" },
    ],
    stayAreas: [
      { area: "Ried im Innkreis Centre", why: "Most practical local base for the match" },
      { area: "Linz", why: "Better wider base if combining football with a larger city stay" },
    ],
    officialInfoUrl: "https://www.svried.at/",
  },
};

export default austrianBundesligaStadiums;
