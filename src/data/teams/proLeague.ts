import type { TeamRecord } from "./types";

const PRO_LEAGUE = 144;
const BELGIUM = "Belgium";

export const proLeagueTeams: Record<string, TeamRecord> = {
  "club-brugge": {
    teamKey: "club-brugge",
    name: "Club Brugge",
    country: BELGIUM,
    city: "Bruges",
    leagueId: PRO_LEAGUE,
    stadiumKey: "jan-breydelstadion",
    founded: 1891,
    clubColors: ["blue", "black"],
    aliases: ["club brugge kv"],
  },

  "anderlecht": {
    teamKey: "anderlecht",
    name: "Anderlecht",
    country: BELGIUM,
    city: "Brussels",
    leagueId: PRO_LEAGUE,
    stadiumKey: "lotto-park",
    founded: 1908,
    clubColors: ["purple", "white"],
    aliases: ["rsc anderlecht"],
  },

  "union-saint-gilloise": {
    teamKey: "union-saint-gilloise",
    name: "Union Saint-Gilloise",
    country: BELGIUM,
    city: "Brussels",
    leagueId: PRO_LEAGUE,
    stadiumKey: "joseph-mariat-stadium",
    founded: 1897,
    clubColors: ["yellow", "blue"],
    aliases: ["union sg", "usg", "royale union saint-gilloise"],
  },

  "antwerp": {
    teamKey: "antwerp",
    name: "Royal Antwerp",
    country: BELGIUM,
    city: "Antwerp",
    leagueId: PRO_LEAGUE,
    stadiumKey: "bosuilstadion",
    founded: 1880,
    clubColors: ["red", "white"],
    aliases: ["royal antwerp fc", "antwerp fc"],
  },

  "gent": {
    teamKey: "gent",
    name: "Gent",
    country: BELGIUM,
    city: "Ghent",
    leagueId: PRO_LEAGUE,
    stadiumKey: "ghelamco-arena",
    founded: 1900,
    clubColors: ["blue", "white"],
    aliases: ["kaa gent"],
  },

  "genk": {
    teamKey: "genk",
    name: "Genk",
    country: BELGIUM,
    city: "Genk",
    leagueId: PRO_LEAGUE,
    stadiumKey: "cegeka-arena",
    founded: 1988,
    clubColors: ["blue", "white"],
    aliases: ["krc genk"],
  },

  "standard-liege": {
    teamKey: "standard-liege",
    name: "Standard Liège",
    country: BELGIUM,
    city: "Liège",
    leagueId: PRO_LEAGUE,
    stadiumKey: "maurice-dufrasne",
    founded: 1898,
    clubColors: ["red", "white"],
    aliases: ["standard de liege", "standard liege"],
  },

  "charleroi": {
    teamKey: "charleroi",
    name: "Charleroi",
    country: BELGIUM,
    city: "Charleroi",
    leagueId: PRO_LEAGUE,
    stadiumKey: "stade-du-pays-de-charleroi",
    founded: 1904,
    clubColors: ["black", "white"],
    aliases: ["sporting charleroi", "royal charleroi sc"],
  },

  "mechelen": {
    teamKey: "mechelen",
    name: "KV Mechelen",
    country: BELGIUM,
    city: "Mechelen",
    leagueId: PRO_LEAGUE,
    stadiumKey: "afas-stadion-mechelen",
    founded: 1904,
    clubColors: ["yellow", "red"],
    aliases: ["kv mechelen", "yellow red kv mechelen"],
  },

  "cercle-brugge": {
    teamKey: "cercle-brugge",
    name: "Cercle Brugge",
    country: BELGIUM,
    city: "Bruges",
    leagueId: PRO_LEAGUE,
    stadiumKey: "jan-breydelstadion",
    founded: 1899,
    clubColors: ["green", "black"],
    aliases: ["cercle brugge", "cercle brugge ksv"],
  },

  "ohl": {
    teamKey: "ohl",
    name: "OH Leuven",
    country: BELGIUM,
    city: "Leuven",
    leagueId: PRO_LEAGUE,
    stadiumKey: "den-dreef",
    founded: 2002,
    clubColors: ["white", "black", "green"],
    aliases: ["oud-heverlee leuven", "leuven", "ohl leuven"],
  },

  "st-truiden": {
    teamKey: "st-truiden",
    name: "St. Truiden",
    country: BELGIUM,
    city: "Sint-Truiden",
    leagueId: PRO_LEAGUE,
    stadiumKey: "stayen",
    founded: 1924,
    clubColors: ["yellow", "blue"],
    aliases: ["stvv", "sint-truiden", "sint truiden"],
  },

  "dender": {
    teamKey: "dender",
    name: "Dender",
    country: BELGIUM,
    city: "Denderleeuw",
    leagueId: PRO_LEAGUE,
    stadiumKey: "dender-football-complex",
    founded: 1935,
    clubColors: ["red", "black"],
    aliases: ["fcv dender", "dender eh", "fcv dender eh"],
  },

  "westerlo": {
    teamKey: "westerlo",
    name: "Westerlo",
    country: BELGIUM,
    city: "Westerlo",
    leagueId: PRO_LEAGUE,
    stadiumKey: "het-kuipje",
    founded: 1933,
    clubColors: ["yellow", "blue"],
    aliases: ["kvc westerlo"],
  },

  "zulte-waregem": {
    teamKey: "zulte-waregem",
    name: "Zulte Waregem",
    country: BELGIUM,
    city: "Waregem",
    leagueId: PRO_LEAGUE,
    stadiumKey: "regenboogstadion",
    founded: 2001,
    clubColors: ["green", "red"],
    aliases: ["essevee", "sv zulte waregem"],
  },

  "raal-la-louviere": {
    teamKey: "raal-la-louviere",
    name: "RAAL La Louvière",
    country: BELGIUM,
    city: "La Louvière",
    leagueId: PRO_LEAGUE,
    stadiumKey: "stade-du-tivoli",
    founded: 2017,
    clubColors: ["green", "white"],
    aliases: ["raal", "la louviere", "raal la louviere"],
  },
};

export default proLeagueTeams;
