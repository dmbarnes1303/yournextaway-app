import type { StadiumRecord } from "./types";

const austrianBundesligaStadiums: Record<string, StadiumRecord> = {
  "red-bull-arena-salzburg": {
    stadiumKey: "red-bull-arena-salzburg",
    name: "Red Bull Arena",
    city: "Salzburg",
    country: "Austria",
    capacity: 31895,
    opened: 2003,
    teamKeys: ["red-bull-salzburg"],
    tips: [
      "Modern stadium with very easy suburban access",
      "Salzburg old town is the best visitor base, not the stadium area itself",
    ],
    transit: [
      { label: "Salzburg Hbf", minutes: 25, note: "Bus/tram connection needed" }
    ],
    stayAreas: [
      { area: "Altstadt", why: "Best overall base for sightseeing, food and atmosphere" },
      { area: "Near Salzburg Hbf", why: "Best for quick onward travel" }
    ]
  },

  "allianz-stadion-vienna": {
    stadiumKey: "allianz-stadion-vienna",
    name: "Allianz Stadion",
    city: "Vienna",
    country: "Austria",
    capacity: 28000,
    opened: 2016,
    teamKeys: ["rapid-vienna"],
    tips: [
      "Best Austrian trip for atmosphere outside Salzburg",
      "Use Vienna city centre as your base rather than staying near the ground",
    ],
    transit: [
      { label: "Hütteldorf", minutes: 10 },
      { label: "Wien Westbahnhof", minutes: 25, note: "Good city access by U-Bahn/S-Bahn" }
    ],
    stayAreas: [
      { area: "Innere Stadt", why: "Best classic Vienna base" },
      { area: "Neubau", why: "Great bars, food and transport" }
    ]
  },

  "generali-arena": {
    stadiumKey: "generali-arena",
    name: "Generali Arena",
    city: "Vienna",
    country: "Austria",
    capacity: 17000,
    opened: 1925,
    teamKeys: ["austria-vienna"],
  },

  "merkur-arena-graz": {
    stadiumKey: "merkur-arena-graz",
    name: "Merkur Arena",
    city: "Graz",
    country: "Austria",
    capacity: 16764,
    opened: 1997,
    teamKeys: ["sturm-graz", "grazer-ak"],
    tips: [
      "Graz is a very good underrated football weekend city",
    ],
    transit: [
      { label: "Graz Hbf", minutes: 20 }
    ],
    stayAreas: [
      { area: "Graz Old Town", why: "Best base for food, bars and city atmosphere" }
    ]
  },

  "raiffeisen-arena-linz": {
    stadiumKey: "raiffeisen-arena-linz",
    name: "Raiffeisen Arena",
    city: "Linz",
    country: "Austria",
    capacity: 19080,
    opened: 2023,
    teamKeys: ["lask"],
  },

  "lavanttal-arena": {
    stadiumKey: "lavanttal-arena",
    name: "Lavanttal Arena",
    city: "Wolfsberg",
    country: "Austria",
    capacity: 7300,
    opened: 1984,
    teamKeys: ["wolfsberger"],
  },

  "profertil-arena-hartberg": {
    stadiumKey: "profertil-arena-hartberg",
    name: "Profertil Arena Hartberg",
    city: "Hartberg",
    country: "Austria",
    capacity: 4500,
    opened: 1996,
    teamKeys: ["hartberg"],
  },

  "hofmann-personal-stadion": {
    stadiumKey: "hofmann-personal-stadion",
    name: "Hofmann Personal Stadion",
    city: "Linz",
    country: "Austria",
    capacity: 5595,
    opened: 1952,
    teamKeys: ["bw-linz"],
  },

  "cashpoint-arena": {
    stadiumKey: "cashpoint-arena",
    name: "Cashpoint Arena",
    city: "Altach",
    country: "Austria",
    capacity: 8500,
    opened: 1990,
    teamKeys: ["altach"],
  },

  "tivoli-stadion-tirol": {
    stadiumKey: "tivoli-stadion-tirol",
    name: "Tivoli Stadion Tirol",
    city: "Innsbruck",
    country: "Austria",
    capacity: 17000,
    opened: 2000,
    teamKeys: ["tirol"],
  },

  "worthersee-stadion": {
    stadiumKey: "worthersee-stadion",
    name: "Wörthersee Stadion",
    city: "Klagenfurt",
    country: "Austria",
    capacity: 30000,
    opened: 2007,
    teamKeys: ["austria-klagenfurt"],
  },
};

export default austrianBundesligaStadiums;
