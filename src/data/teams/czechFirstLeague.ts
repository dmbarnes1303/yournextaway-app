import type { TeamRecord } from "./types";

const CZECH_FIRST_LEAGUE = 345;
const CZECHIA = "Czech Republic";

export const czechFirstLeagueTeams: Record<string, TeamRecord> = {

  "sparta-prague": {
    teamKey: "sparta-prague",
    name: "Sparta Prague",
    country: CZECHIA,
    city: "Prague",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "epet-arena",
    founded: 1893,
    clubColors: ["red"],
    aliases: ["ac sparta praha", "sparta"],
  },

  "slavia-prague": {
    teamKey: "slavia-prague",
    name: "Slavia Prague",
    country: CZECHIA,
    city: "Prague",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "fortuna-arena-prague",
    founded: 1892,
    clubColors: ["red", "white"],
    aliases: ["sk slavia praha"],
  },

  "plzen": {
    teamKey: "plzen",
    name: "Viktoria Plzeň",
    country: CZECHIA,
    city: "Plzeň",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "dosan-arena",
    founded: 1911,
    clubColors: ["red", "blue"],
    aliases: ["fc viktoria plzen"],
  },

  "banik-ostrava": {
    teamKey: "banik-ostrava",
    name: "Baník Ostrava",
    country: CZECHIA,
    city: "Ostrava",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "mestsky-stadion-ostrava",
    founded: 1922,
    clubColors: ["blue", "white"],
    aliases: ["fc banik ostrava"],
  },

  "sigma-olomouc": {
    teamKey: "sigma-olomouc",
    name: "Sigma Olomouc",
    country: CZECHIA,
    city: "Olomouc",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "andr-stadium",
    founded: 1919,
    clubColors: ["blue", "white"],
    aliases: ["sk sigma olomouc"],
  },

  "slovan-liberec": {
    teamKey: "slovan-liberec",
    name: "Slovan Liberec",
    country: CZECHIA,
    city: "Liberec",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "stadion-u-nisy",
    founded: 1958,
    clubColors: ["blue"],
    aliases: ["fc slovan liberec"],
  },

  "mlada-boleslav": {
    teamKey: "mlada-boleslav",
    name: "Mladá Boleslav",
    country: CZECHIA,
    city: "Mladá Boleslav",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "lokotrans-arena",
    founded: 1902,
    clubColors: ["blue"],
    aliases: ["fk mlada boleslav"],
  },

  "bohemians-1905": {
    teamKey: "bohemians-1905",
    name: "Bohemians 1905",
    country: CZECHIA,
    city: "Prague",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "dolicek",
    founded: 1905,
    clubColors: ["green"],
    aliases: ["bohemians prague"],
  },

  "hradec-kralove": {
    teamKey: "hradec-kralove",
    name: "Hradec Králové",
    country: CZECHIA,
    city: "Hradec Králové",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "malso-vicka-arena",
    founded: 1905,
    clubColors: ["black", "white"],
    aliases: ["fc hradec kralove"],
  },

  "teplice": {
    teamKey: "teplice",
    name: "Teplice",
    country: CZECHIA,
    city: "Teplice",
    leagueId: CZECH_FIRST_LEAGUE,
    stadiumKey: "agc-arena",
    founded: 1945,
    clubColors: ["yellow", "blue"],
    aliases: ["fk teplice"],
  },

};

export default czechFirstLeagueTeams;
