import type { StadiumRecord } from "./types";

const swissSuperLeagueStadiums: Record<string, StadiumRecord> = {
  "wankdorf": {
    stadiumKey: "wankdorf",
    name: "Stadion Wankdorf",
    city: "Bern",
    country: "Switzerland",
    capacity: 31783,
    opened: 2005,
    airport: "Bern Airport (BRN)",
    distanceFromAirportKm: 10,
    teamKeys: ["young-boys"],
    transit: [
      { label: "Bern Wankdorf", minutes: 10 },
      { label: "Bern Hauptbahnhof", minutes: 20, note: "best wider city and rail hub" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best classic Bern base with atmosphere and walkability" },
      { area: "Near Hauptbahnhof", why: "Best practical rail-led option" },
    ],
    tips: [
      "Bern is one of the easiest and most attractive football city breaks in the league",
      "Stay central Bern, not around the stadium district",
    ],
  },

  "st-jakob-park": {
    stadiumKey: "st-jakob-park",
    name: "St. Jakob-Park",
    city: "Basel",
    country: "Switzerland",
    capacity: 38512,
    opened: 2001,
    airport: "EuroAirport Basel Mulhouse Freiburg (BSL)",
    distanceFromAirportKm: 12,
    teamKeys: ["basel"],
    transit: [
      { label: "Basel SBB", minutes: 15 },
      { label: "St. Jakob", minutes: 10, note: "best local approach" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best atmosphere and city-break quality" },
      { area: "Near Basel SBB", why: "Best practical rail and airport base" },
    ],
    tips: [
      "One of Switzerland’s strongest football city-breaks because Basel is compact and easy",
      "Central Basel is the right stay base unless you only care about matchday proximity",
    ],
  },

  "letzigrund": {
    stadiumKey: "letzigrund",
    name: "Letzigrund",
    city: "Zurich",
    country: "Switzerland",
    capacity: 26104,
    opened: 2007,
    airport: "Zurich Airport (ZRH)",
    distanceFromAirportKm: 12,
    teamKeys: ["zurich", "grasshoppers"],
    transit: [
      { label: "Hardbrücke", minutes: 15 },
      { label: "Zürich HB", minutes: 20, note: "best wider city and rail hub" },
    ],
    stayAreas: [
      { area: "Altstadt / City Centre", why: "Best classic Zurich base" },
      { area: "Langstrasse / Kreis 4", why: "Best bars, nightlife and more local feel" },
    ],
    tips: [
      "Zurich is one of the best pure city-break football bases in the wider coverage map",
      "Very easy to combine football with a high-quality weekend trip",
    ],
  },

  "stade-de-geneve": {
    stadiumKey: "stade-de-geneve",
    name: "Stade de Genève",
    city: "Geneva",
    country: "Switzerland",
    capacity: 30084,
    opened: 2003,
    airport: "Geneva Airport (GVA)",
    distanceFromAirportKm: 10,
    teamKeys: ["servette"],
    transit: [
      { label: "Lancy-Pont-Rouge", minutes: 15 },
      { label: "Genève Cornavin", minutes: 20, note: "best wider city and rail hub" },
    ],
    stayAreas: [
      { area: "City Centre / Cornavin", why: "Best practical Geneva base" },
      { area: "Old Town / lakefront", why: "Best premium scenic stay option" },
    ],
    tips: [
      "Geneva is expensive but very easy and polished as a football city trip",
      "Best if you want clean logistics and strong city-break value more than raw atmosphere",
    ],
  },

  "stade-de-la-tuiliere": {
    stadiumKey: "stade-de-la-tuiliere",
    name: "Stade de la Tuilière",
    city: "Lausanne",
    country: "Switzerland",
    capacity: 12544,
    opened: 2020,
    airport: "Geneva Airport (GVA)",
    distanceFromAirportKm: 60,
    teamKeys: ["lausanne-sport"],
    transit: [
      { label: "Lausanne", minutes: 20 },
      { label: "City centre / Ouchy", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Centre", why: "Best practical local base" },
      { area: "Ouchy", why: "Best scenic lakefront stay" },
    ],
    tips: [
      "Lausanne is stronger as a city-break destination than the club size alone suggests",
      "Very good option if you want football plus lake and old-city scenery",
    ],
  },

  "stadio-cornaredo": {
    stadiumKey: "stadio-cornaredo",
    name: "Stadio Cornaredo",
    city: "Lugano",
    country: "Switzerland",
    capacity: 11000,
    opened: 1951,
    airport: "Lugano Airport (LUG)",
    distanceFromAirportKm: 7,
    teamKeys: ["lugano"],
    transit: [
      { label: "Lugano Station", minutes: 20 },
      { label: "City centre / lakefront", minutes: 15, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Lugano Centre", why: "Best all-round local base" },
      { area: "Lakefront", why: "Best scenic premium stay option" },
    ],
    tips: [
      "One of the most attractive football weekend settings in the league because Lugano is a genuine leisure destination",
      "A very strong football-plus-scenery trip",
    ],
  },

  "kybunpark": {
    stadiumKey: "kybunpark",
    name: "Kybunpark",
    city: "St. Gallen",
    country: "Switzerland",
    capacity: 19694,
    opened: 2008,
    airport: "St. Gallen–Altenrhein Airport (ACH)",
    distanceFromAirportKm: 24,
    teamKeys: ["st-gallen"],
    transit: [
      { label: "St. Gallen", minutes: 20 },
      { label: "City centre / old town", minutes: 20, note: "best local base" },
    ],
    stayAreas: [
      { area: "Old Town", why: "Best atmosphere and city character" },
      { area: "Near station", why: "Best practical rail-led option" },
    ],
    tips: [
      "One of the better smaller Swiss football city trips because the town itself is attractive",
      "Best as a simple overnight with the old town as the base",
    ],
  },

  "swissporarena": {
    stadiumKey: "swissporarena",
    name: "Swissporarena",
    city: "Lucerne",
    country: "Switzerland",
    capacity: 16800,
    opened: 2011,
    airport: "Zurich Airport (ZRH)",
    distanceFromAirportKm: 68,
    teamKeys: ["lucerne"],
    transit: [
      { label: "Luzern Bahnhof", minutes: 20 },
      { label: "Old Town / lakefront", minutes: 20, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best classic Lucerne base" },
      { area: "Lakefront", why: "Best scenic premium stay option" },
    ],
    tips: [
      "Lucerne is one of the best pure scenic football city breaks in the wider coverage set",
      "Very strong if you want football plus a high-quality Swiss weekend setting",
    ],
  },

  "schutzenwiese": {
    stadiumKey: "schutzenwiese",
    name: "Stadion Schützenwiese",
    city: "Winterthur",
    country: "Switzerland",
    capacity: 9400,
    opened: 1900,
    airport: "Zurich Airport (ZRH)",
    distanceFromAirportKm: 25,
    teamKeys: ["winterthur"],
    transit: [
      { label: "Winterthur", minutes: 15 },
      { label: "Zurich HB", minutes: 30, note: "best wider city base" },
    ],
    stayAreas: [
      { area: "Winterthur Centre", why: "Best local practical option" },
      { area: "Zurich", why: "Stronger broader city-break base if combining travel" },
    ],
    tips: [
      "A smaller football stop with decent practicality thanks to Zurich-region access",
      "Usually more sensible as part of a Zurich-based trip than a full luxury weekend alone",
    ],
  },

  "tourbillon": {
    stadiumKey: "tourbillon",
    name: "Stade de Tourbillon",
    city: "Sion",
    country: "Switzerland",
    capacity: 14500,
    opened: 1968,
    airport: "Geneva Airport (GVA)",
    distanceFromAirportKm: 170,
    teamKeys: ["sion"],
    transit: [
      { label: "Sion Station", minutes: 20 },
      { label: "Old Town", minutes: 15, note: "best local base" },
    ],
    stayAreas: [
      { area: "Sion Centre", why: "Best practical and atmospheric local base" },
      { area: "Old Town", why: "Best if you want the stronger historic-city feel" },
    ],
    tips: [
      "A more niche Swiss football trip, but the Alpine setting gives it unique value",
      "Works well as part of a wider scenic Swiss itinerary",
    ],
  },

  "stockhorn-arena": {
    stadiumKey: "stockhorn-arena",
    name: "Stockhorn Arena",
    city: "Thun",
    country: "Switzerland",
    capacity: 10000,
    opened: 2011,
    airport: "Bern Airport (BRN)",
    distanceFromAirportKm: 28,
    teamKeys: ["thun"],
    transit: [
      { label: "Thun Station", minutes: 20 },
      { label: "Old Town / lakefront", minutes: 15, note: "best visitor base" },
    ],
    stayAreas: [
      { area: "Thun Centre", why: "Best practical local base" },
      { area: "Bern", why: "Better broader city-break base if combining travel" },
    ],
    tips: [
      "More of a scenic football stop than a giant atmosphere trip",
      "Very good if you want football folded into a wider Swiss lakes-and-mountains weekend",
    ],
  },
};

export default swissSuperLeagueStadiums;
