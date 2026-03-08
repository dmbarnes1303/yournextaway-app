import type { StadiumRecord } from "./types";

const BULGARIA = "Bulgaria";

export const firstLeagueBulgariaStadiums: Record<string, StadiumRecord> = {

  "georgi-asparuhov": {
    stadiumKey: "georgi-asparuhov",
    name: "Georgi Asparuhov Stadium",
    city: "Sofia",
    country: BULGARIA,
    capacity: 25000,
    opened: 1963,
    teamKeys: ["levski-sofia"],
    airport: "Sofia Airport (SOF)",
    distanceFromAirportKm: 6,
    transit: [
      { label: "Hadzhi Dimitar Metro", minutes: 15, note: "best metro stop for stadium access" },
      { label: "Sofia City Centre", minutes: 15, note: "central base for visitors" }
    ],
    stayAreas: [
      { area: "Sofia City Centre", why: "Best base for hotels, bars and transport connections" }
    ],
    tips: [
      "One of the biggest clubs in Bulgaria with strong support",
      "Most visitors stay in central Sofia and take taxi or metro"
    ]
  },

  "bistritsa-stadium": {
    stadiumKey: "bistritsa-stadium",
    name: "Bistritsa Stadium",
    city: "Bistritsa",
    country: BULGARIA,
    capacity: 3000,
    teamKeys: ["cska-1948"],
    airport: "Sofia Airport (SOF)",
    distanceFromAirportKm: 15,
    transit: [
      { label: "Sofia Centre", minutes: 25, note: "main visitor base" }
    ],
    stayAreas: [
      { area: "Sofia City Centre", why: "Best overall base for this fixture" }
    ],
    tips: [
      "Small suburban ground used by CSKA 1948",
      "Treat this as a Sofia trip rather than a stadium destination"
    ]
  },

  "huvepharma-arena": {
    stadiumKey: "huvepharma-arena",
    name: "Huvepharma Arena",
    city: "Razgrad",
    country: BULGARIA,
    capacity: 10422,
    opened: 1954,
    teamKeys: ["ludogorets"],
    airport: "Varna Airport (VAR)",
    distanceFromAirportKm: 140,
    transit: [
      { label: "Razgrad centre", minutes: 15, note: "best local anchor" }
    ],
    stayAreas: [
      { area: "Varna", why: "Better hotels and nightlife than Razgrad" }
    ],
    tips: [
      "Home of Bulgaria's dominant club in recent years",
      "Many visitors base in Varna and travel in"
    ]
  },

  "botevgrad-army-stadium": {
    stadiumKey: "botevgrad-army-stadium",
    name: "Balgarska Armia Stadium",
    city: "Sofia",
    country: BULGARIA,
    capacity: 22015,
    opened: 1967,
    teamKeys: ["cska-sofia"],
    airport: "Sofia Airport (SOF)",
    distanceFromAirportKm: 11,
    transit: [
      { label: "Sofia centre", minutes: 10, note: "central visitor base" }
    ],
    stayAreas: [
      { area: "Sofia Centre", why: "Best location for nightlife and transport" }
    ],
    tips: [
      "Historic ground of CSKA Sofia",
      "Located close to Borisova Gradina park"
    ]
  },

  "ticha-stadium": {
    stadiumKey: "ticha-stadium",
    name: "Ticha Stadium",
    city: "Varna",
    country: BULGARIA,
    capacity: 8250,
    opened: 1935,
    teamKeys: ["cherno-more"],
    airport: "Varna Airport (VAR)",
    distanceFromAirportKm: 9,
    transit: [
      { label: "Varna centre", minutes: 15, note: "best base for visitors" }
    ],
    stayAreas: [
      { area: "Varna City Centre", why: "Best hotels and nightlife" },
      { area: "Varna Seafront", why: "Great if combining football with a coastal trip" }
    ],
    tips: [
      "Varna is Bulgaria's main Black Sea city",
      "Easy to combine football with a beach weekend"
    ]
  },

  "lokomotiv-stadium-plovdiv": {
    stadiumKey: "lokomotiv-stadium-plovdiv",
    name: "Lokomotiv Stadium",
    city: "Plovdiv",
    country: BULGARIA,
    capacity: 14000,
    opened: 1982,
    teamKeys: ["lokomotiv-plovdiv"],
    airport: "Plovdiv Airport (PDV)",
    distanceFromAirportKm: 15,
    transit: [
      { label: "Plovdiv centre", minutes: 10, note: "best visitor base" }
    ],
    stayAreas: [
      { area: "Plovdiv Old Town", why: "Beautiful historic centre and best hotels" }
    ],
    tips: [
      "Plovdiv is one of the most beautiful cities in Bulgaria",
      "Very good football weekend destination"
    ]
  },

  "aleksandar-shalamanov": {
    stadiumKey: "aleksandar-shalamanov",
    name: "Aleksandar Shalamanov Stadium",
    city: "Sofia",
    country: BULGARIA,
    capacity: 25000,
    teamKeys: ["slavia-sofia"],
    airport: "Sofia Airport (SOF)",
    distanceFromAirportKm: 16,
    transit: [
      { label: "Sofia centre", minutes: 20, note: "best visitor base" }
    ],
    stayAreas: [
      { area: "Sofia Centre", why: "Best for hotels and nightlife" }
    ],
    tips: [
      "One of Sofia's traditional clubs",
      "Best combined with a wider Sofia football trip"
    ]
  },

  "arena-arda": {
    stadiumKey: "arena-arda",
    name: "Arena Arda",
    city: "Kardzhali",
    country: BULGARIA,
    capacity: 15000,
    teamKeys: ["arda"],
    airport: "Plovdiv Airport (PDV)",
    distanceFromAirportKm: 90,
    transit: [
      { label: "Kardzhali centre", minutes: 10, note: "best local base" }
    ],
    stayAreas: [
      { area: "Plovdiv", why: "Better travel base than Kardzhali" }
    ],
    tips: [
      "Modernised stadium for a small regional club"
    ]
  },

  "hristo-botev-stadium-vratsa": {
    stadiumKey: "hristo-botev-stadium-vratsa",
    name: "Hristo Botev Stadium",
    city: "Vratsa",
    country: BULGARIA,
    capacity: 10000,
    teamKeys: ["botev-vratsa"],
    airport: "Sofia Airport (SOF)",
    distanceFromAirportKm: 110,
    transit: [
      { label: "Vratsa centre", minutes: 15, note: "best local anchor" }
    ],
    stayAreas: [
      { area: "Sofia", why: "Better base for visitors travelling to the match" }
    ],
    tips: [
      "Small regional stadium",
      "Often visited as part of a Sofia trip"
    ]
  },

  "lokomotiv-stadium-sofia": {
    stadiumKey: "lokomotiv-stadium-sofia",
    name: "Lokomotiv Stadium Sofia",
    city: "Sofia",
    country: BULGARIA,
    capacity: 22000,
    teamKeys: ["lokomotiv-sofia"],
    airport: "Sofia Airport (SOF)",
    distanceFromAirportKm: 8,
    transit: [
      { label: "Sofia centre", minutes: 15, note: "main visitor base" }
    ],
    stayAreas: [
      { area: "Sofia Centre", why: "Best hotels and nightlife" }
    ],
    tips: [
      "Traditional Sofia club with historic stadium"
    ]
  },

  "hristo-botev-stadium-plovdiv": {
    stadiumKey: "hristo-botev-stadium-plovdiv",
    name: "Hristo Botev Stadium",
    city: "Plovdiv",
    country: BULGARIA,
    capacity: 18000,
    opened: 2023,
    teamKeys: ["botev-plovdiv"],
    airport: "Plovdiv Airport (PDV)",
    distanceFromAirportKm: 15,
    transit: [
      { label: "Plovdiv centre", minutes: 10, note: "best visitor base" }
    ],
    stayAreas: [
      { area: "Plovdiv Old Town", why: "Best hotels and nightlife" }
    ],
    tips: [
      "Brand new stadium opened recently",
      "One of the best modern grounds in Bulgaria"
    ]
  },

  "druzhba-stadium": {
    stadiumKey: "druzhba-stadium",
    name: "Druzhba Stadium",
    city: "Dobrich",
    country: BULGARIA,
    capacity: 12000,
    teamKeys: ["dobrudzha"],
    airport: "Varna Airport (VAR)",
    distanceFromAirportKm: 40,
    transit: [
      { label: "Dobrich centre", minutes: 15, note: "best local anchor" }
    ],
    stayAreas: [
      { area: "Varna", why: "Better hotels and coastal city atmosphere" }
    ],
    tips: [
      "Small regional stadium"
    ]
  },

  "spartak-stadium-varna": {
    stadiumKey: "spartak-stadium-varna",
    name: "Spartak Stadium",
    city: "Varna",
    country: BULGARIA,
    capacity: 8000,
    teamKeys: ["spartak-varna"],
    airport: "Varna Airport (VAR)",
    distanceFromAirportKm: 8,
    transit: [
      { label: "Varna centre", minutes: 10, note: "best base for visitors" }
    ],
    stayAreas: [
      { area: "Varna Centre", why: "Best hotels and nightlife" }
    ],
    tips: [
      "Traditional club from the Black Sea city"
    ]
  },

  "dragalevtsi-stadium": {
    stadiumKey: "dragalevtsi-stadium",
    name: "Dragalevtsi Stadium",
    city: "Sofia",
    country: BULGARIA,
    capacity: 3500,
    teamKeys: ["septemvri-sofia"],
    airport: "Sofia Airport (SOF)",
    distanceFromAirportKm: 12,
    transit: [
      { label: "Sofia centre", minutes: 20, note: "best visitor base" }
    ],
    stayAreas: [
      { area: "Sofia Centre", why: "Best hotels and nightlife" }
    ],
    tips: [
      "Small ground used by Septemvri Sofia"
    ]
  },

  "beroe-stadium": {
    stadiumKey: "beroe-stadium",
    name: "Beroe Stadium",
    city: "Stara Zagora",
    country: BULGARIA,
    capacity: 12000,
    teamKeys: ["beroe"],
    airport: "Plovdiv Airport (PDV)",
    distanceFromAirportKm: 95,
    transit: [
      { label: "Stara Zagora centre", minutes: 15, note: "best visitor base" }
    ],
    stayAreas: [
      { area: "Stara Zagora Centre", why: "Best local base" }
    ],
    tips: [
      "Traditional Bulgarian club stadium"
    ]
  },

  "ogosta-stadium": {
    stadiumKey: "ogosta-stadium",
    name: "Ogosta Stadium",
    city: "Montana",
    country: BULGARIA,
    capacity: 8000,
    teamKeys: ["montana"],
    airport: "Sofia Airport (SOF)",
    distanceFromAirportKm: 110,
    transit: [
      { label: "Montana centre", minutes: 10, note: "best local anchor" }
    ],
    stayAreas: [
      { area: "Sofia", why: "Better visitor base" }
    ],
    tips: [
      "Small regional football ground"
    ]
  }

};

export default firstLeagueBulgariaStadiums;
