import type { StadiumRecord } from "./types";

const scottishPremiershipStadiums: Record<string, StadiumRecord> = {
  "celtic-park": {
    stadiumKey: "celtic-park",
    name: "Celtic Park",
    city: "Glasgow",
    country: "Scotland",
    capacity: 60411,
    opened: 1892,
    airport: "Glasgow Airport (GLA)",
    distanceFromAirportKm: 20,
    teamKeys: ["celtic"],
    tips: [
      "One of the best atmospheres in European football",
      "Arrive early — build-up around the ground is excellent",
    ],
    transit: [
      { label: "Dalmarnock Station", minutes: 10 },
      { label: "Bridgeton Station", minutes: 10 },
    ],
    stayAreas: [
      { area: "Glasgow City Centre", why: "Best hotels, pubs and transport links" },
      { area: "Merchant City", why: "Best bars, restaurants and central atmosphere" },
    ],
  },

  "ibrox": {
    stadiumKey: "ibrox",
    name: "Ibrox Stadium",
    city: "Glasgow",
    country: "Scotland",
    capacity: 50817,
    opened: 1899,
    airport: "Glasgow Airport (GLA)",
    distanceFromAirportKm: 10,
    teamKeys: ["rangers"],
    tips: [
      "Historic stadium with strong matchday atmosphere",
      "Subway makes it very easy to reach from city centre",
    ],
    transit: [
      { label: "Ibrox Subway Station", minutes: 5 },
      { label: "Glasgow Central", minutes: 20, note: "best wider rail hub" },
    ],
    stayAreas: [
      { area: "Glasgow City Centre", why: "Best base for visiting fans and nightlife" },
      { area: "Finnieston", why: "Great bars and food with easy west-side access" },
    ],
  },

  "tynecastle": {
    stadiumKey: "tynecastle",
    name: "Tynecastle Park",
    city: "Edinburgh",
    country: "Scotland",
    capacity: 20099,
    opened: 1886,
    airport: "Edinburgh Airport (EDI)",
    distanceFromAirportKm: 10,
    teamKeys: ["hearts"],
    tips: [
      "Compact stadium known for loud atmosphere",
      "Walking distance from Edinburgh city centre",
    ],
    transit: [
      { label: "Haymarket Station", minutes: 15 },
      { label: "West End / tram corridor", minutes: 15, note: "best practical city approach" },
    ],
    stayAreas: [
      { area: "Edinburgh Old Town", why: "Historic area with pubs, restaurants and attractions" },
      { area: "Haymarket", why: "Closest transport hub to the stadium" },
    ],
  },

  "easter-road": {
    stadiumKey: "easter-road",
    name: "Easter Road",
    city: "Edinburgh",
    country: "Scotland",
    capacity: 20421,
    opened: 1893,
    airport: "Edinburgh Airport (EDI)",
    distanceFromAirportKm: 16,
    teamKeys: ["hibernian"],
    tips: [
      "Short walk from central Edinburgh",
      "Leith area nearby has good pubs and restaurants",
    ],
    transit: [
      { label: "Edinburgh Waverley", minutes: 20 },
      { label: "Leith Walk", minutes: 15, note: "useful local base and approach" },
    ],
    stayAreas: [
      { area: "Old Town", why: "Best atmosphere and tourism area" },
      { area: "Leith", why: "Great pubs and food scene" },
    ],
  },

  "pittodrie": {
    stadiumKey: "pittodrie",
    name: "Pittodrie Stadium",
    city: "Aberdeen",
    country: "Scotland",
    capacity: 20866,
    opened: 1899,
    airport: "Aberdeen Airport (ABZ)",
    distanceFromAirportKm: 12,
    teamKeys: ["aberdeen"],
    tips: [
      "Classic old-school ground feel and one of the stronger away weekends in the north",
      "Best handled as a central Aberdeen trip rather than staying right by the stadium",
    ],
    transit: [
      { label: "Aberdeen Station", minutes: 25 },
      { label: "City centre / Union Street", minutes: 20 },
    ],
    stayAreas: [
      { area: "City Centre", why: "Best all-round base for food, pubs and transport" },
      { area: "Union Square / Station", why: "Best practical base for rail-led travel" },
    ],
  },

  "tannadice": {
    stadiumKey: "tannadice",
    name: "Tannadice Park",
    city: "Dundee",
    country: "Scotland",
    capacity: 14223,
    opened: 1883,
    airport: "Edinburgh Airport (EDI)",
    distanceFromAirportKm: 95,
    teamKeys: ["dundee-united"],
    tips: [
      "Traditional ground and a good old-school Scottish football stop",
      "Dundee works best as a simple football overnight rather than a luxury weekend",
    ],
    transit: [
      { label: "Dundee Station", minutes: 25 },
      { label: "City centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Dundee Centre", why: "Best local practical base" },
      { area: "Waterfront", why: "Best if you want the tidier modern part of the city" },
    ],
  },

  "dens-park": {
    stadiumKey: "dens-park",
    name: "Dens Park",
    city: "Dundee",
    country: "Scotland",
    capacity: 11506,
    opened: 1899,
    airport: "Edinburgh Airport (EDI)",
    distanceFromAirportKm: 95,
    teamKeys: ["dundee"],
    tips: [
      "Another very traditional Scottish football stop with a more old-school feel than polished modern grounds",
      "Best paired with a central Dundee stay rather than treated as a stadium-area trip",
    ],
    transit: [
      { label: "Dundee Station", minutes: 25 },
      { label: "City centre", minutes: 20 },
    ],
    stayAreas: [
      { area: "Dundee Centre", why: "Best practical base for pubs, food and walking access" },
      { area: "Waterfront", why: "Best cleaner hotel-focused option" },
    ],
  },

  "fir-park": {
    stadiumKey: "fir-park",
    name: "Fir Park",
    city: "Motherwell",
    country: "Scotland",
    capacity: 13500,
    opened: 1895,
    airport: "Glasgow Airport (GLA)",
    distanceFromAirportKm: 35,
    teamKeys: ["motherwell"],
    tips: [
      "More of a classic football stop than a full city-break destination",
      "Often better handled from Glasgow if you want a stronger overnight base",
    ],
    transit: [
      { label: "Motherwell Station", minutes: 20 },
      { label: "Glasgow Central", minutes: 30, note: "best wider base" },
    ],
    stayAreas: [
      { area: "Motherwell Centre", why: "Most practical local option" },
      { area: "Glasgow City Centre", why: "Far better city-break base if combining football with nightlife" },
    ],
  },

  "st-mirren-park": {
    stadiumKey: "st-mirren-park",
    name: "St Mirren Park",
    city: "Paisley",
    country: "Scotland",
    capacity: 8000,
    opened: 2009,
    airport: "Glasgow Airport (GLA)",
    distanceFromAirportKm: 3,
    teamKeys: ["st-mirren"],
    tips: [
      "One of the easiest airport-to-stadium trips in Scotland",
      "Usually best treated as a Glasgow trip with Paisley as the match stop",
    ],
    transit: [
      { label: "Paisley Gilmour Street", minutes: 15 },
      { label: "Glasgow Central", minutes: 20, note: "best wider rail and nightlife base" },
    ],
    stayAreas: [
      { area: "Paisley Centre", why: "Best local practical base" },
      { area: "Glasgow City Centre", why: "Better hotels, pubs and overall trip value" },
    ],
  },

  "rugby-park": {
    stadiumKey: "rugby-park",
    name: "Rugby Park",
    city: "Kilmarnock",
    country: "Scotland",
    capacity: 18128,
    opened: 1899,
    airport: "Glasgow Prestwick Airport (PIK)",
    distanceFromAirportKm: 15,
    teamKeys: ["kilmarnock"],
    tips: [
      "A straightforward football stop with a strong traditional-ground feel",
      "Often better as part of a wider west-of-Scotland football plan than a stand-alone luxury weekend",
    ],
    transit: [
      { label: "Kilmarnock Station", minutes: 15 },
      { label: "Town centre", minutes: 10 },
    ],
    stayAreas: [
      { area: "Kilmarnock Centre", why: "Most practical local option" },
      { area: "Glasgow", why: "Better broader base if you want stronger nightlife and hotels" },
    ],
  },

  "victoria-park-dingwall": {
    stadiumKey: "victoria-park-dingwall",
    name: "Victoria Park",
    city: "Dingwall",
    country: "Scotland",
    capacity: 6590,
    opened: 1929,
    airport: "Inverness Airport (INV)",
    distanceFromAirportKm: 34,
    teamKeys: ["ross-county"],
    tips: [
      "A distinctive Highlands football trip rather than a conventional city break",
      "Best if you lean into the regional travel aspect rather than expecting big-city convenience",
    ],
    transit: [
      { label: "Dingwall Station", minutes: 10 },
      { label: "Inverness", minutes: 30, note: "best wider base in the region" },
    ],
    stayAreas: [
      { area: "Dingwall", why: "Best local practical option if keeping it simple" },
      { area: "Inverness", why: "Far stronger regional base with more hotels, pubs and transport" },
    ],
  },

  "mcdiarmid-park": {
    stadiumKey: "mcdiarmid-park",
    name: "McDiarmid Park",
    city: "Perth",
    country: "Scotland",
    capacity: 10673,
    opened: 1989,
    airport: "Edinburgh Airport (EDI)",
    distanceFromAirportKm: 65,
    teamKeys: ["st-johnstone"],
    tips: [
      "A neat, practical football stop with Perth providing a better overnight base than some expect",
      "Works best as a shorter football stay rather than a long premium weekend",
    ],
    transit: [
      { label: "Perth Station", minutes: 30 },
      { label: "Perth Centre", minutes: 25 },
    ],
    stayAreas: [
      { area: "Perth Centre", why: "Best local practical base" },
      { area: "Near station", why: "Best for easy rail arrival and departure" },
    ],
  },
};

export default scottishPremiershipStadiums;
