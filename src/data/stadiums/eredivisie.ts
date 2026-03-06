import type { StadiumRecord } from "./types";

const eredivisieStadiums: Record<string, StadiumRecord> = {

  "johan-cruyff-arena": {
    stadiumKey: "johan-cruyff-arena",
    name: "Johan Cruyff Arena",
    city: "Amsterdam",
    country: "Netherlands",
    capacity: 55885,
    opened: 1996,
    teamKeys: ["ajax"],
    tips: [
      "Large modern stadium in the Amsterdam Zuidoost district",
      "Area has bars and restaurants but city centre pre-match is better",
    ],
    transit: [
      { label: "Amsterdam Bijlmer ArenA (Train + Metro)", minutes: 3 },
      { label: "Strandvliet (Metro)", minutes: 10 }
    ],
    stayAreas: [
      { area: "Amsterdam Centrum", why: "Best nightlife and tourist base" },
      { area: "De Pijp", why: "Lively neighbourhood with bars and restaurants" }
    ]
  },

  "philips-stadion": {
    stadiumKey: "philips-stadion",
    name: "Philips Stadion",
    city: "Eindhoven",
    country: "Netherlands",
    capacity: 35000,
    opened: 1913,
    teamKeys: ["psv"],
    tips: [
      "Stadium sits right in the city centre",
      "Very easy matchday experience with pubs nearby",
    ],
    transit: [
      { label: "Eindhoven Central Station", minutes: 10 }
    ],
    stayAreas: [
      { area: "Eindhoven City Centre", why: "Everything within walking distance" }
    ]
  },

  "de-kuip": {
    stadiumKey: "de-kuip",
    name: "De Kuip",
    city: "Rotterdam",
    country: "Netherlands",
    capacity: 51177,
    opened: 1937,
    teamKeys: ["feyenoord"],
    tips: [
      "One of the most famous stadium atmospheres in Europe",
      "Arrive early to experience the build-up around the ground",
    ],
    transit: [
      { label: "Rotterdam Zuid (Train)", minutes: 15 },
      { label: "Stadion Feyenoord (Tram)", minutes: 5 }
    ],
    stayAreas: [
      { area: "Rotterdam Centrum", why: "Best hotels, restaurants and nightlife" }
    ]
  },

  "afas-stadion": {
    stadiumKey: "afas-stadion",
    name: "AFAS Stadion",
    city: "Alkmaar",
    country: "Netherlands",
    capacity: 19500,
    opened: 2006,
    teamKeys: ["az-alkmaar"],
  },

  "de-grolsch-veste": {
    stadiumKey: "de-grolsch-veste",
    name: "De Grolsch Veste",
    city: "Enschede",
    country: "Netherlands",
    capacity: 30205,
    opened: 1998,
    teamKeys: ["twente"],
  },

  "galgenwaard": {
    stadiumKey: "galgenwaard",
    name: "Stadion Galgenwaard",
    city: "Utrecht",
    country: "Netherlands",
    capacity: 23750,
    opened: 1936,
    teamKeys: ["utrecht"],
  },

  "gelredome": {
    stadiumKey: "gelredome",
    name: "GelreDome",
    city: "Arnhem",
    country: "Netherlands",
    capacity: 34000,
    opened: 1998,
    teamKeys: ["vitesse"],
  },

  "euroborg": {
    stadiumKey: "euroborg",
    name: "Euroborg",
    city: "Groningen",
    country: "Netherlands",
    capacity: 22579,
    opened: 2006,
    teamKeys: ["groningen"],
  },

  "abe-lenstra-stadion": {
    stadiumKey: "abe-lenstra-stadion",
    name: "Abe Lenstra Stadion",
    city: "Heerenveen",
    country: "Netherlands",
    capacity: 26100,
    opened: 1994,
    teamKeys: ["heerenveen"],
  },

  "goffertstadion": {
    stadiumKey: "goffertstadion",
    name: "Goffertstadion",
    city: "Nijmegen",
    country: "Netherlands",
    capacity: 12500,
    opened: 1939,
    teamKeys: ["nec-nijmegen"],
  },

  "mac3park-stadion": {
    stadiumKey: "mac3park-stadion",
    name: "MAC³PARK Stadion",
    city: "Zwolle",
    country: "Netherlands",
    capacity: 14000,
    opened: 2009,
    teamKeys: ["pec-zwolle"],
  },

  "erve-asito": {
    stadiumKey: "erve-asito",
    name: "Erve Asito",
    city: "Almelo",
    country: "Netherlands",
    capacity: 12500,
    opened: 1999,
    teamKeys: ["heracles"],
  },

  "de-adelaarshorst": {
    stadiumKey: "de-adelaarshorst",
    name: "De Adelaarshorst",
    city: "Deventer",
    country: "Netherlands",
    capacity: 10400,
    opened: 1920,
    teamKeys: ["go-ahead-eagles"],
  },

  "spangen": {
    stadiumKey: "spangen",
    name: "Sparta Stadion Het Kasteel",
    city: "Rotterdam",
    country: "Netherlands",
    capacity: 11000,
    opened: 1916,
    teamKeys: ["sparta-rotterdam"],
  },

  "fortuna-sittard-stadion": {
    stadiumKey: "fortuna-sittard-stadion",
    name: "Fortuna Sittard Stadion",
    city: "Sittard",
    country: "Netherlands",
    capacity: 12500,
    opened: 1999,
    teamKeys: ["fortuna-sittard"],
  },

  "mandemakers-stadion": {
    stadiumKey: "mandemakers-stadion",
    name: "Mandemakers Stadion",
    city: "Waalwijk",
    country: "Netherlands",
    capacity: 7500,
    opened: 1996,
    teamKeys: ["rkc-waalwijk"],
  },

  "kras-stadion": {
    stadiumKey: "kras-stadion",
    name: "Kras Stadion",
    city: "Volendam",
    country: "Netherlands",
    capacity: 7384,
    opened: 1975,
    teamKeys: ["volendam"],
  },

  "yanmar-stadion": {
    stadiumKey: "yanmar-stadion",
    name: "Yanmar Stadion",
    city: "Almere",
    country: "Netherlands",
    capacity: 4500,
    opened: 2005,
    teamKeys: ["almere-city"],
  }

};

export default eredivisieStadiums;
