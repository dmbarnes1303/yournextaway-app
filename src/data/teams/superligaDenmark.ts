import type { TeamRecord } from "./types";

const SUPERLIGA = 119;
const DENMARK = "Denmark";

export const superligaDenmarkTeams: Record<string, TeamRecord> = {

  "fc-copenhagen": {
    teamKey: "fc-copenhagen",
    name: "FC Copenhagen",
    country: DENMARK,
    city: "Copenhagen",
    leagueId: SUPERLIGA,
    stadiumKey: "parken-stadium",
    founded: 1992,
    clubColors: ["white", "blue"],
    aliases: ["fck"],
  },

  "brondby": {
    teamKey: "brondby",
    name: "Brøndby",
    country: DENMARK,
    city: "Brøndby",
    leagueId: SUPERLIGA,
    stadiumKey: "brondby-stadium",
    founded: 1964,
    clubColors: ["yellow", "blue"],
    aliases: ["brondby if"],
  },

  "midtjylland": {
    teamKey: "midtjylland",
    name: "FC Midtjylland",
    country: DENMARK,
    city: "Herning",
    leagueId: SUPERLIGA,
    stadiumKey: "mch-arena",
    founded: 1999,
    clubColors: ["black", "red"],
    aliases: ["fcm"],
  },

  "aarhus": {
    teamKey: "aarhus",
    name: "AGF Aarhus",
    country: DENMARK,
    city: "Aarhus",
    leagueId: SUPERLIGA,
    stadiumKey: "ceres-park",
    founded: 1880,
    clubColors: ["white", "blue"],
    aliases: ["agf"],
  },

  "nordsjaelland": {
    teamKey: "nordsjaelland",
    name: "FC Nordsjælland",
    country: DENMARK,
    city: "Farum",
    leagueId: SUPERLIGA,
    stadiumKey: "right-to-dream-park",
    founded: 1991,
    clubColors: ["red", "yellow"],
    aliases: ["fcn"],
  },

  "silkeborg": {
    teamKey: "silkeborg",
    name: "Silkeborg",
    country: DENMARK,
    city: "Silkeborg",
    leagueId: SUPERLIGA,
    stadiumKey: "jysk-park",
    founded: 1917,
    clubColors: ["red", "white"],
    aliases: ["silkeborg if"],
  },

  "randers": {
    teamKey: "randers",
    name: "Randers FC",
    country: DENMARK,
    city: "Randers",
    leagueId: SUPERLIGA,
    stadiumKey: "cepheus-park",
    founded: 2003,
    clubColors: ["blue", "white"],
    aliases: ["randers"],
  },

  "odense": {
    teamKey: "odense",
    name: "Odense BK",
    country: DENMARK,
    city: "Odense",
    leagueId: SUPERLIGA,
    stadiumKey: "nature-energy-park",
    founded: 1887,
    clubColors: ["blue", "white"],
    aliases: ["ob"],
  },

  "viborg": {
    teamKey: "viborg",
    name: "Viborg",
    country: DENMARK,
    city: "Viborg",
    leagueId: SUPERLIGA,
    stadiumKey: "energi-viborg-arena",
    founded: 1896,
    clubColors: ["green"],
    aliases: ["viborg ff"],
  },

  "vejle": {
    teamKey: "vejle",
    name: "Vejle",
    country: DENMARK,
    city: "Vejle",
    leagueId: SUPERLIGA,
    stadiumKey: "vejle-stadium",
    founded: 1891,
    clubColors: ["red"],
    aliases: ["vejle bk"],
  },

  "lyngby": {
    teamKey: "lyngby",
    name: "Lyngby",
    country: DENMARK,
    city: "Lyngby",
    leagueId: SUPERLIGA,
    stadiumKey: "lyngby-stadium",
    founded: 1921,
    clubColors: ["blue", "white"],
    aliases: ["lyngby bk"],
  },

  "sonderjyske": {
    teamKey: "sonderjyske",
    name: "SønderjyskE",
    country: DENMARK,
    city: "Haderslev",
    leagueId: SUPERLIGA,
    stadiumKey: "sydbank-park",
    founded: 2004,
    clubColors: ["blue"],
    aliases: ["sonderjyske"],
  },

};

export default superligaDenmarkTeams;
