import type { StadiumRecord } from "./types";

const proLeagueStadiums: Record<string, StadiumRecord> = {
  "jan-breydelstadion": {
    stadiumKey: "jan-breydelstadion",
    name: "Jan Breydel Stadium",
    city: "Bruges",
    country: "Belgium",
    capacity: 29042,
    opened: 1975,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 110,
    teamKeys: ["club-brugge", "cercle-brugge"],
    transit: [
      { label: "Brugge Station", minutes: 25 },
      { label: "Bruges Centre", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Historic Centre", why: "Best overall Bruges base with atmosphere and walkability" },
      { area: "Near Brugge Station", why: "Best practical rail-led option" },
    ],
    tips: [
      "One of the best football-and-city-break combinations in Belgium because Bruges does a lot of the work",
      "Stay in the historic centre, not by the stadium",
    ],
  },

  "lotto-park": {
    stadiumKey: "lotto-park",
    name: "Lotto Park",
    city: "Brussels",
    country: "Belgium",
    capacity: 21000,
    opened: 1917,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 20,
    teamKeys: ["anderlecht"],
    transit: [
      { label: "Saint-Guidon / Sint-Guido", minutes: 8 },
      { label: "Brussels Midi", minutes: 20, note: "best rail and wider city hub" },
    ],
    stayAreas: [
      { area: "Grand Place / Centre", why: "Best classic Brussels city-break base" },
      { area: "Ixelles / Louise", why: "Better food, bars and more polished stay" },
    ],
    tips: [
      "This is a Brussels trip first and an Anderlecht trip second",
      "Central Brussels is usually the right base unless you only care about match proximity",
    ],
  },

  "joseph-mariat-stadium": {
    stadiumKey: "joseph-mariat-stadium",
    name: "Joseph Marien Stadium",
    city: "Brussels",
    country: "Belgium",
    capacity: 9400,
    opened: 1919,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 19,
    teamKeys: ["union-saint-gilloise"],
    transit: [
      { label: "Brussels Midi", minutes: 20 },
      { label: "Saint-Gilles / Parvis", minutes: 12, note: "best local neighbourhood base" },
    ],
    stayAreas: [
      { area: "Saint-Gilles", why: "Best local atmosphere and bars" },
      { area: "Ixelles / Louise", why: "Best wider city-break base nearby" },
    ],
    tips: [
      "One of the most characterful club trips in Belgium despite the smaller ground",
      "Saint-Gilles makes this feel much more distinctive than a generic Brussels football stop",
    ],
  },

  "bosuilstadion": {
    stadiumKey: "bosuilstadion",
    name: "Bosuilstadion",
    city: "Antwerp",
    country: "Belgium",
    capacity: 16649,
    opened: 1923,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 45,
    teamKeys: ["antwerp"],
    transit: [
      { label: "Antwerpen-Centraal", minutes: 25 },
      { label: "Old Town / Groenplaats", minutes: 25, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Historic Centre", why: "Best food, bars and city-break quality" },
      { area: "Around Antwerpen-Centraal", why: "Best practical base for rail arrivals" },
    ],
    tips: [
      "Antwerp is one of the best football weekend cities in Belgium",
      "Stay central and treat the ground as a short local journey",
    ],
  },

  "ghelamco-arena": {
    stadiumKey: "ghelamco-arena",
    name: "Ghelamco Arena",
    city: "Ghent",
    country: "Belgium",
    capacity: 20000,
    opened: 2013,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 65,
    teamKeys: ["gent"],
    transit: [
      { label: "Gent-Sint-Pieters", minutes: 20 },
      { label: "Ghent Centre", minutes: 25, note: "best city-break base" },
    ],
    stayAreas: [
      { area: "Patershol / Centre", why: "Best atmosphere and historic-city feel" },
      { area: "Near Gent-Sint-Pieters", why: "Best practical rail-based option" },
    ],
    tips: [
      "Ghent is one of the strongest hidden-value football city breaks in northern Europe",
      "The city centre is where the trip comes alive, not the stadium district",
    ],
  },

  "cegeka-arena": {
    stadiumKey: "cegeka-arena",
    name: "Cegeka Arena",
    city: "Genk",
    country: "Belgium",
    capacity: 23500,
    opened: 1999,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 85,
    teamKeys: ["genk"],
    transit: [
      { label: "Genk Station", minutes: 25 },
      { label: "Hasselt", minutes: 30, note: "better wider nearby base" },
    ],
    stayAreas: [
      { area: "Genk Centre", why: "Most practical local option" },
      { area: "Hasselt", why: "Better wider base with stronger bars and city feel" },
    ],
    tips: [
      "More of a football-focused trip than a classic glamour city break",
      "Hasselt can be the smarter overnight base if you want a better off-pitch stay",
    ],
  },

  "maurice-dufrasne": {
    stadiumKey: "maurice-dufrasne",
    name: "Stade Maurice Dufrasne",
    city: "Liège",
    country: "Belgium",
    capacity: 27670,
    opened: 1909,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 95,
    teamKeys: ["standard-liege"],
    transit: [
      { label: "Liège-Guillemins", minutes: 20 },
      { label: "City centre", minutes: 20, note: "best local visitor base" },
    ],
    stayAreas: [
      { area: "Carré / Centre", why: "Best nightlife and local atmosphere" },
      { area: "Near Liège-Guillemins", why: "Best practical rail-led option" },
    ],
    tips: [
      "One of Belgium’s stronger atmosphere-led football trips",
      "Liège is rougher around the edges than Bruges or Ghent, but that gives it more character",
    ],
  },

  "stade-du-pays-de-charleroi": {
    stadiumKey: "stade-du-pays-de-charleroi",
    name: "Stade du Pays de Charleroi",
    city: "Charleroi",
    country: "Belgium",
    capacity: 15000,
    opened: 1939,
    airport: "Brussels South Charleroi Airport (CRL)",
    distanceFromAirportKm: 9,
    teamKeys: ["charleroi"],
    transit: [
      { label: "Charleroi-Sud", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "City Centre", why: "Most practical local option" },
      { area: "Brussels", why: "Stronger city-break base if you are not staying purely for convenience" },
    ],
    tips: [
      "Very practical because of airport proximity, but not one of Belgium’s prettiest city breaks",
      "Often better treated as a simple fixture stop than a long weekend destination",
    ],
  },

  "afas-stadion-mechelen": {
    stadiumKey: "afas-stadion-mechelen",
    name: "AFAS Stadion",
    city: "Mechelen",
    country: "Belgium",
    capacity: 16700,
    opened: 1911,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 22,
    teamKeys: ["mechelen"],
    transit: [
      { label: "Mechelen Station", minutes: 20 },
      { label: "Historic centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Historic Centre", why: "Best local atmosphere and city feel" },
      { area: "Near Mechelen Station", why: "Best practical rail option" },
    ],
    tips: [
      "Mechelen is a better football stop than many people realise",
      "Very good if you want a smaller Belgian city trip without the Bruges crowds",
    ],
  },

  "guldensporenstadion": {
    stadiumKey: "guldensporenstadion",
    name: "Guldensporenstadion",
    city: "Kortrijk",
    country: "Belgium",
    capacity: 9399,
    opened: 1947,
    airport: "Lille Airport (LIL)",
    distanceFromAirportKm: 40,
    teamKeys: ["kortrijk"],
    transit: [
      { label: "Kortrijk Station", minutes: 20 },
      { label: "City centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Kortrijk Centre", why: "Best local practical base" },
      { area: "Lille", why: "Better wider city-break base if combining football and travel" },
    ],
    tips: [
      "A more niche football stop than a flagship weekend trip",
      "Useful if building a wider cross-border football itinerary",
    ],
  },

  "den-dreef": {
    stadiumKey: "den-dreef",
    name: "Den Dreef",
    city: "Leuven",
    country: "Belgium",
    capacity: 10200,
    opened: 2002,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 25,
    teamKeys: ["ohl"],
    transit: [
      { label: "Leuven Station", minutes: 20 },
      { label: "Old Market / centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Centre", why: "Best bars, food and compact walkable base" },
      { area: "Near Leuven Station", why: "Best practical rail-led option" },
    ],
    tips: [
      "Very good small-city football trip because Leuven is lively and compact",
      "A strong sleeper pick if you want atmosphere without the biggest-club crowds",
    ],
  },

  "stayen": {
    stadiumKey: "stayen",
    name: "Stayen",
    city: "Sint-Truiden",
    country: "Belgium",
    capacity: 14600,
    opened: 1927,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 70,
    teamKeys: ["st-truiden"],
    transit: [
      { label: "Sint-Truiden Station", minutes: 20 },
      { label: "Town centre", minutes: 15 },
    ],
    stayAreas: [
      { area: "Sint-Truiden Centre", why: "Most practical local option" },
      { area: "Leuven", why: "Stronger broader base if you want more nightlife and rail flexibility" },
    ],
    tips: [
      "More of a simple football stop than a premium city-break destination",
      "Best done if you like smaller-ground variety rather than glamour fixtures",
    ],
  },

  "dender-football-complex": {
    stadiumKey: "dender-football-complex",
    name: "Dender Football Complex",
    city: "Denderleeuw",
    country: "Belgium",
    capacity: 6500,
    opened: 2008,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 40,
    teamKeys: ["dender"],
    transit: [
      { label: "Denderleeuw Station", minutes: 20 },
      { label: "Brussels", minutes: 30, note: "best wider base" },
    ],
    stayAreas: [
      { area: "Denderleeuw", why: "Simplest local option if staying nearby" },
      { area: "Brussels", why: "Best overall city-break base with far more choice" },
    ],
    tips: [
      "Very much a football stop rather than a destination weekend in its own right",
      "Brussels is usually the smarter base if timings allow",
    ],
  },

  "het-kuipje": {
    stadiumKey: "het-kuipje",
    name: "Het Kuipje",
    city: "Westerlo",
    country: "Belgium",
    capacity: 8035,
    opened: 1933,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 55,
    teamKeys: ["westerlo"],
    transit: [
      { label: "Westerlo centre", minutes: 15 },
      { label: "Antwerp", minutes: 45, note: "better wider city base" },
    ],
    stayAreas: [
      { area: "Westerlo", why: "Most practical local base" },
      { area: "Antwerp", why: "Stronger city-break option if doing more than just the match" },
    ],
    tips: [
      "A niche smaller-ground stop rather than a high-end football weekend",
      "Best as part of a wider Belgium trip",
    ],
  },

  "regenboogstadion": {
    stadiumKey: "regenboogstadion",
    name: "Regenboogstadion",
    city: "Waregem",
    country: "Belgium",
    capacity: 12500,
    opened: 1957,
    airport: "Brussels Airport (BRU)",
    distanceFromAirportKm: 90,
    teamKeys: ["zulte-waregem"],
    transit: [
      { label: "Waregem Station", minutes: 20 },
      { label: "Kortrijk", minutes: 25, note: "better wider nearby base" },
    ],
    stayAreas: [
      { area: "Waregem Centre", why: "Most practical local option" },
      { area: "Ghent", why: "Better city-break base if building a wider trip" },
    ],
    tips: [
      "Another useful Belgian football stop rather than a glamour destination",
      "Best approached as part of a broader northern Belgium itinerary",
    ],
  },
};

export default proLeagueStadiums;
