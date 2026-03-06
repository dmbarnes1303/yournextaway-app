import type { TeamRecord } from "./types";

const EREDIVISIE = 88;
const NETHERLANDS = "Netherlands";

export const eredivisieTeams: Record<string, TeamRecord> = {

  "ajax": {
    teamKey: "ajax",
    name: "Ajax",
    country: NETHERLANDS,
    city: "Amsterdam",
    leagueId: EREDIVISIE,
    stadiumKey: "johan-cruyff-arena",
    founded: 1900,
    clubColors: ["red", "white"],
    aliases: ["afc ajax"],
  },

  "psv": {
    teamKey: "psv",
    name: "PSV Eindhoven",
    country: NETHERLANDS,
    city: "Eindhoven",
    leagueId: EREDIVISIE,
    stadiumKey: "philips-stadion",
    founded: 1913,
    clubColors: ["red", "white"],
    aliases: ["psv eindhoven"],
  },

  "feyenoord": {
    teamKey: "feyenoord",
    name: "Feyenoord",
    country: NETHERLANDS,
    city: "Rotterdam",
    leagueId: EREDIVISIE,
    stadiumKey: "de-kuip",
    founded: 1908,
    clubColors: ["red", "white", "black"],
    aliases: ["feyenoord rotterdam"],
  },

  "az-alkmaar": {
    teamKey: "az-alkmaar",
    name: "AZ Alkmaar",
    country: NETHERLANDS,
    city: "Alkmaar",
    leagueId: EREDIVISIE,
    stadiumKey: "afas-stadion",
    founded: 1967,
    clubColors: ["red", "white"],
    aliases: ["az"],
  },

  "twente": {
    teamKey: "twente",
    name: "FC Twente",
    country: NETHERLANDS,
    city: "Enschede",
    leagueId: EREDIVISIE,
    stadiumKey: "de-grolsch-veste",
    founded: 1965,
    clubColors: ["red"],
    aliases: ["fc twente"],
  },

  "utrecht": {
    teamKey: "utrecht",
    name: "FC Utrecht",
    country: NETHERLANDS,
    city: "Utrecht",
    leagueId: EREDIVISIE,
    stadiumKey: "galgenwaard",
    founded: 1970,
    clubColors: ["red", "white"],
    aliases: ["fc utrecht"],
  },

  "vitesse": {
    teamKey: "vitesse",
    name: "Vitesse",
    country: NETHERLANDS,
    city: "Arnhem",
    leagueId: EREDIVISIE,
    stadiumKey: "gelredome",
    founded: 1892,
    clubColors: ["yellow", "black"],
    aliases: ["sbv vitesse"],
  },

  "groningen": {
    teamKey: "groningen",
    name: "Groningen",
    country: NETHERLANDS,
    city: "Groningen",
    leagueId: EREDIVISIE,
    stadiumKey: "euroborg",
    founded: 1971,
    clubColors: ["green", "white"],
    aliases: ["fc groningen"],
  },

  "heerenveen": {
    teamKey: "heerenveen",
    name: "Heerenveen",
    country: NETHERLANDS,
    city: "Heerenveen",
    leagueId: EREDIVISIE,
    stadiumKey: "abe-lenstra-stadion",
    founded: 1920,
    clubColors: ["blue", "white"],
    aliases: ["sc heerenveen"],
  },

  "nec-nijmegen": {
    teamKey: "nec-nijmegen",
    name: "NEC Nijmegen",
    country: NETHERLANDS,
    city: "Nijmegen",
    leagueId: EREDIVISIE,
    stadiumKey: "goffertstadion",
    founded: 1900,
    clubColors: ["red", "green", "black"],
    aliases: ["nec"],
  },

  "pec-zwolle": {
    teamKey: "pec-zwolle",
    name: "PEC Zwolle",
    country: NETHERLANDS,
    city: "Zwolle",
    leagueId: EREDIVISIE,
    stadiumKey: "mac3park-stadion",
    founded: 1910,
    clubColors: ["blue", "white"],
    aliases: ["zwolle"],
  },

  "heracles": {
    teamKey: "heracles",
    name: "Heracles Almelo",
    country: NETHERLANDS,
    city: "Almelo",
    leagueId: EREDIVISIE,
    stadiumKey: "erve-asito",
    founded: 1903,
    clubColors: ["black", "white"],
    aliases: ["heracles almelo"],
  },

  "go-ahead-eagles": {
    teamKey: "go-ahead-eagles",
    name: "Go Ahead Eagles",
    country: NETHERLANDS,
    city: "Deventer",
    leagueId: EREDIVISIE,
    stadiumKey: "de-adelaarshorst",
    founded: 1902,
    clubColors: ["red", "yellow"],
    aliases: ["gae"],
  },

  "sparta-rotterdam": {
    teamKey: "sparta-rotterdam",
    name: "Sparta Rotterdam",
    country: NETHERLANDS,
    city: "Rotterdam",
    leagueId: EREDIVISIE,
    stadiumKey: "spangen",
    founded: 1888,
    clubColors: ["red", "white"],
    aliases: ["sparta"],
  },

  "fortuna-sittard": {
    teamKey: "fortuna-sittard",
    name: "Fortuna Sittard",
    country: NETHERLANDS,
    city: "Sittard",
    leagueId: EREDIVISIE,
    stadiumKey: "fortuna-sittard-stadion",
    founded: 1968,
    clubColors: ["yellow", "green"],
    aliases: ["fortuna"],
  },

  "rkc-waalwijk": {
    teamKey: "rkc-waalwijk",
    name: "RKC Waalwijk",
    country: NETHERLANDS,
    city: "Waalwijk",
    leagueId: EREDIVISIE,
    stadiumKey: "mandemakers-stadion",
    founded: 1940,
    clubColors: ["yellow", "blue"],
    aliases: ["rkc"],
  },

  "volendam": {
    teamKey: "volendam",
    name: "Volendam",
    country: NETHERLANDS,
    city: "Volendam",
    leagueId: EREDIVISIE,
    stadiumKey: "kras-stadion",
    founded: 1920,
    clubColors: ["orange", "black"],
    aliases: ["fc volendam"],
  },

  "almere-city": {
    teamKey: "almere-city",
    name: "Almere City",
    country: NETHERLANDS,
    city: "Almere",
    leagueId: EREDIVISIE,
    stadiumKey: "yanmar-stadion",
    founded: 2001,
    clubColors: ["red", "black"],
    aliases: ["almere"],
  }

};

export default eredivisieTeams;
