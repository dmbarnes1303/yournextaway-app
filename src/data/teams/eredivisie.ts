// src/data/teams/eredivisie.ts
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

  "groningen": {
    teamKey: "groningen",
    name: "FC Groningen",
    country: NETHERLANDS,
    city: "Groningen",
    leagueId: EREDIVISIE,
    stadiumKey: "euroborg",
    founded: 1971,
    clubColors: ["green", "white"],
    aliases: ["groningen", "fc groningen"],
  },

  "heerenveen": {
    teamKey: "heerenveen",
    name: "SC Heerenveen",
    country: NETHERLANDS,
    city: "Heerenveen",
    leagueId: EREDIVISIE,
    stadiumKey: "abe-lenstra-stadion",
    founded: 1920,
    clubColors: ["blue", "white"],
    aliases: ["heerenveen", "sc heerenveen"],
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
    aliases: ["nec", "nec nijmegen"],
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
    aliases: ["pec", "pec zwolle", "zwolle"],
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
    aliases: ["heracles", "heracles almelo"],
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
    aliases: ["go ahead eagles", "gae"],
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
    aliases: ["sparta", "sparta rotterdam"],
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
    aliases: ["fortuna", "fortuna sittard"],
  },

  "volendam": {
    teamKey: "volendam",
    name: "FC Volendam",
    country: NETHERLANDS,
    city: "Volendam",
    leagueId: EREDIVISIE,
    stadiumKey: "kras-stadion",
    founded: 1920,
    clubColors: ["orange", "black"],
    aliases: ["volendam", "fc volendam"],
  },

  "nac-breda": {
    teamKey: "nac-breda",
    name: "NAC Breda",
    country: NETHERLANDS,
    city: "Breda",
    leagueId: EREDIVISIE,
    stadiumKey: "rat-verlegh-stadion",
    founded: 1912,
    clubColors: ["yellow", "black"],
    aliases: ["nac", "nac breda", "noad advendo combinatie"],
  },

  "excelsior": {
    teamKey: "excelsior",
    name: "Excelsior",
    country: NETHERLANDS,
    city: "Rotterdam",
    leagueId: EREDIVISIE,
    stadiumKey: "van-donge-de-roo-stadion",
    founded: 1902,
    clubColors: ["red", "black"],
    aliases: ["excelsior rotterdam", "sbv excelsior"],
  },

  "telstar": {
    teamKey: "telstar",
    name: "Telstar",
    country: NETHERLANDS,
    city: "Velsen-Zuid",
    leagueId: EREDIVISIE,
    stadiumKey: "711-stadion",
    founded: 1963,
    clubColors: ["white", "red", "blue"],
    aliases: ["sc telstar", "telstar ijmuiden", "witte leeuwen"],
  },
};

export default eredivisieTeams;
