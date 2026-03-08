import type { StadiumRecord } from "./types";

const IRELAND = "Ireland";

export const leagueOfIrelandPremierStadiums: Record<string, StadiumRecord> = {

  "dalymount-park": {
    stadiumKey: "dalymount-park",
    name: "Dalymount Park",
    city: "Dublin",
    country: IRELAND,
    capacity: 7000,
    opened: 1901,
    teamKeys: ["bohemians"],
    airport: "Dublin Airport (DUB)",
    distanceFromAirportKm: 10,
    transit: [{ label: "Dublin City Centre", minutes: 15, note: "best visitor base" }],
    stayAreas: [{ area: "Temple Bar / City Centre", why: "best nightlife and hotel access" }],
    tips: ["Historic Irish football ground", "Major redevelopment underway"]
  },

  "richmond-park": {
    stadiumKey: "richmond-park",
    name: "Richmond Park",
    city: "Dublin",
    country: IRELAND,
    capacity: 5340,
    opened: 1925,
    teamKeys: ["st-patricks-athletic"],
    airport: "Dublin Airport (DUB)",
    distanceFromAirportKm: 14,
    transit: [{ label: "Dublin City Centre", minutes: 15 }],
    stayAreas: [{ area: "Temple Bar / City Centre", why: "best base for visitors" }],
    tips: ["Compact stadium with strong atmosphere"]
  },

  "tallaght-stadium": {
    stadiumKey: "tallaght-stadium",
    name: "Tallaght Stadium",
    city: "Dublin",
    country: IRELAND,
    capacity: 10500,
    opened: 2009,
    teamKeys: ["shamrock-rovers"],
    airport: "Dublin Airport (DUB)",
    distanceFromAirportKm: 24,
    transit: [{ label: "Dublin City Centre", minutes: 35 }],
    stayAreas: [{ area: "Dublin City Centre", why: "best hotel base" }],
    tips: ["Modern stadium of Ireland's most successful club"]
  },

  "brandywell-stadium": {
    stadiumKey: "brandywell-stadium",
    name: "Brandywell Stadium",
    city: "Derry",
    country: IRELAND,
    capacity: 7700,
    opened: 1928,
    teamKeys: ["derry-city"],
    airport: "City of Derry Airport (LDY)",
    distanceFromAirportKm: 13,
    transit: [{ label: "Derry City Centre", minutes: 5 }],
    stayAreas: [{ area: "Derry City Centre", why: "best base for visitors" }],
    tips: ["Iconic ground close to the historic city walls"]
  },

  "weavers-park": {
    stadiumKey: "weavers-park",
    name: "Weavers Park",
    city: "Drogheda",
    country: IRELAND,
    capacity: 3500,
    teamKeys: ["drogheda-united"],
    airport: "Dublin Airport (DUB)",
    distanceFromAirportKm: 42,
    transit: [{ label: "Drogheda Centre", minutes: 10 }],
    stayAreas: [{ area: "Dublin", why: "better hotel options" }],
    tips: ["Small ground formerly known as United Park"]
  },

  "tolka-park": {
    stadiumKey: "tolka-park",
    name: "Tolka Park",
    city: "Dublin",
    country: IRELAND,
    capacity: 6000,
    opened: 1921,
    teamKeys: ["shelbourne"],
    airport: "Dublin Airport (DUB)",
    distanceFromAirportKm: 8,
    transit: [{ label: "Dublin City Centre", minutes: 10 }],
    stayAreas: [{ area: "Temple Bar", why: "best nightlife area" }],
    tips: ["One of the most historic Irish stadiums"]
  },

  "eamonn-deacy-park": {
    stadiumKey: "eamonn-deacy-park",
    name: "Eamonn Deacy Park",
    city: "Galway",
    country: IRELAND,
    capacity: 5200,
    teamKeys: ["galway-united"],
    airport: "Shannon Airport (SNN)",
    distanceFromAirportKm: 85,
    transit: [{ label: "Galway Centre", minutes: 5 }],
    stayAreas: [{ area: "Galway Centre", why: "excellent nightlife and pubs" }],
    tips: ["Great football trip destination city"]
  },

  "oriel-park": {
    stadiumKey: "oriel-park",
    name: "Oriel Park",
    city: "Dundalk",
    country: IRELAND,
    capacity: 4500,
    teamKeys: ["dundalk"],
    airport: "Dublin Airport (DUB)",
    distanceFromAirportKm: 75,
    transit: [{ label: "Dundalk Centre", minutes: 5 }],
    stayAreas: [{ area: "Dublin", why: "better accommodation options" }],
    tips: ["Dundalk dominated Irish football in the late 2010s"]
  },

  "showgrounds-sligo": {
    stadiumKey: "showgrounds-sligo",
    name: "The Showgrounds",
    city: "Sligo",
    country: IRELAND,
    capacity: 4500,
    opened: 1928,
    teamKeys: ["sligo-rovers"],
    airport: "Ireland West Airport Knock (NOC)",
    distanceFromAirportKm: 55,
    transit: [{ label: "Sligo Centre", minutes: 5 }],
    stayAreas: [{ area: "Sligo Centre", why: "best pubs and hotels" }],
    tips: ["One of Ireland's most scenic football towns"]
  },

  "regional-sports-centre": {
    stadiumKey: "regional-sports-centre",
    name: "Waterford Regional Sports Centre",
    city: "Waterford",
    country: IRELAND,
    capacity: 5500,
    teamKeys: ["waterford"],
    airport: "Dublin Airport (DUB)",
    distanceFromAirportKm: 170,
    transit: [{ label: "Waterford Centre", minutes: 10 }],
    stayAreas: [{ area: "Waterford Centre", why: "best accommodation base" }],
    tips: ["Main stadium in Ireland's oldest city"]
  }

};

export default leagueOfIrelandPremierStadiums;
