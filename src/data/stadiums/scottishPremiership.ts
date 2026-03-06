import type { StadiumRecord } from "./types";

const scottishPremiershipStadiums: Record<string, StadiumRecord> = {

  "celtic-park": {
    stadiumKey: "celtic-park",
    name: "Celtic Park",
    city: "Glasgow",
    country: "Scotland",
    capacity: 60411,
    opened: 1892,
    teamKeys: ["celtic"],
    tips: [
      "One of the best atmospheres in European football",
      "Arrive early — build-up around the ground is excellent",
    ],
    transit: [
      { label: "Dalmarnock Station", minutes: 10 },
      { label: "Bridgeton Station", minutes: 10 }
    ],
    stayAreas: [
      { area: "Glasgow City Centre", why: "Best hotels, pubs and transport links" }
    ]
  },

  "ibrox": {
    stadiumKey: "ibrox",
    name: "Ibrox Stadium",
    city: "Glasgow",
    country: "Scotland",
    capacity: 50817,
    opened: 1899,
    teamKeys: ["rangers"],
    tips: [
      "Historic stadium with strong matchday atmosphere",
      "Subway makes it very easy to reach from city centre",
    ],
    transit: [
      { label: "Ibrox Subway Station", minutes: 5 }
    ],
    stayAreas: [
      { area: "Glasgow City Centre", why: "Best base for visiting fans and nightlife" }
    ]
  },

  "tynecastle": {
    stadiumKey: "tynecastle",
    name: "Tynecastle Park",
    city: "Edinburgh",
    country: "Scotland",
    capacity: 20099,
    opened: 1886,
    teamKeys: ["hearts"],
    tips: [
      "Compact stadium known for loud atmosphere",
      "Walking distance from Edinburgh city centre",
    ],
    transit: [
      { label: "Haymarket Station", minutes: 15 }
    ],
    stayAreas: [
      { area: "Edinburgh Old Town", why: "Historic area with pubs, restaurants and attractions" },
      { area: "Haymarket", why: "Closest transport hub to the stadium" }
    ]
  },

  "easter-road": {
    stadiumKey: "easter-road",
    name: "Easter Road",
    city: "Edinburgh",
    country: "Scotland",
    capacity: 20421,
    opened: 1893,
    teamKeys: ["hibernian"],
    tips: [
      "Short walk from central Edinburgh",
      "Leith area nearby has good pubs and restaurants",
    ],
    transit: [
      { label: "Edinburgh Waverley", minutes: 20 }
    ],
    stayAreas: [
      { area: "Old Town", why: "Best atmosphere and tourism area" },
      { area: "Leith", why: "Great pubs and food scene" }
    ]
  },

  "pittodrie": {
    stadiumKey: "pittodrie",
    name: "Pittodrie Stadium",
    city: "Aberdeen",
    country: "Scotland",
    capacity: 20866,
    opened: 1899,
    teamKeys: ["aberdeen"],
  },

  "tannadice": {
    stadiumKey: "tannadice",
    name: "Tannadice Park",
    city: "Dundee",
    country: "Scotland",
    capacity: 14223,
    opened: 1883,
    teamKeys: ["dundee-united"],
  },

  "dens-park": {
    stadiumKey: "dens-park",
    name: "Dens Park",
    city: "Dundee",
    country: "Scotland",
    capacity: 11506,
    opened: 1899,
    teamKeys: ["dundee"],
  },

  "fir-park": {
    stadiumKey: "fir-park",
    name: "Fir Park",
    city: "Motherwell",
    country: "Scotland",
    capacity: 13500,
    opened: 1895,
    teamKeys: ["motherwell"],
  },

  "st-mirren-park": {
    stadiumKey: "st-mirren-park",
    name: "St Mirren Park",
    city: "Paisley",
    country: "Scotland",
    capacity: 8000,
    opened: 2009,
    teamKeys: ["st-mirren"],
  },

  "rugby-park": {
    stadiumKey: "rugby-park",
    name: "Rugby Park",
    city: "Kilmarnock",
    country: "Scotland",
    capacity: 18128,
    opened: 1899,
    teamKeys: ["kilmarnock"],
  },

  "victoria-park-dingwall": {
    stadiumKey: "victoria-park-dingwall",
    name: "Victoria Park",
    city: "Dingwall",
    country: "Scotland",
    capacity: 6590,
    opened: 1929,
    teamKeys: ["ross-county"],
  },

  "mcdiarmid-park": {
    stadiumKey: "mcdiarmid-park",
    name: "McDiarmid Park",
    city: "Perth",
    country: "Scotland",
    capacity: 10673,
    opened: 1989,
    teamKeys: ["st-johnstone"],
  }

};

export default scottishPremiershipStadiums;
