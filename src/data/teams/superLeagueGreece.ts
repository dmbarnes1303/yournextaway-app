import type { TeamRecord } from "./types";

const SUPER_LEAGUE_GREECE = 197;
const GREECE = "Greece";

export const superLeagueGreeceTeams: Record<string, TeamRecord> = {
  "olympiacos": {
    teamKey: "olympiacos",
    name: "Olympiacos",
    country: GREECE,
    city: "Piraeus",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "karaiskakis-stadium",
    founded: 1925,
    clubColors: ["red", "white"],
    aliases: ["olympiacos fc", "olympiakos"],
  },

  "panathinaikos": {
    teamKey: "panathinaikos",
    name: "Panathinaikos",
    country: GREECE,
    city: "Athens",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "apostolos-nikolaidis",
    founded: 1908,
    clubColors: ["green", "white"],
    aliases: ["pao", "panathinaikos fc"],
  },

  "aek-athens": {
    teamKey: "aek-athens",
    name: "AEK Athens",
    country: GREECE,
    city: "Athens",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "agia-sofia-stadium",
    founded: 1924,
    clubColors: ["yellow", "black"],
    aliases: ["aek", "aek fc"],
  },

  "paok": {
    teamKey: "paok",
    name: "PAOK",
    country: GREECE,
    city: "Thessaloniki",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "toumba-stadium",
    founded: 1926,
    clubColors: ["black", "white"],
    aliases: ["paok fc"],
  },

  "aris": {
    teamKey: "aris",
    name: "Aris Thessaloniki",
    country: GREECE,
    city: "Thessaloniki",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "kleanthis-vikelidis-stadium",
    founded: 1914,
    clubColors: ["yellow", "black"],
    aliases: ["aris fc", "aris thessaloniki fc"],
  },

  "asteras-tripolis": {
    teamKey: "asteras-tripolis",
    name: "Asteras Tripolis",
    country: GREECE,
    city: "Tripoli",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "theodoros-kolokotronis",
    founded: 1931,
    clubColors: ["yellow", "blue"],
    aliases: ["asteras", "asteras aktor", "asteras tripolis fc"],
  },

  "atromitos": {
    teamKey: "atromitos",
    name: "Atromitos",
    country: GREECE,
    city: "Athens",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "peristeri-stadium",
    founded: 1923,
    clubColors: ["blue", "white"],
    aliases: ["atromitos fc"],
  },

  "ofi": {
    teamKey: "ofi",
    name: "OFI Crete",
    country: GREECE,
    city: "Heraklion",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "theodoros-vardinogiannis",
    founded: 1925,
    clubColors: ["black", "white"],
    aliases: ["ofi fc", "ofi"],
  },

  "volos": {
    teamKey: "volos",
    name: "Volos",
    country: GREECE,
    city: "Volos",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "panthessaliko-stadium",
    founded: 2017,
    clubColors: ["red", "blue"],
    aliases: ["volos nfc", "volos fc"],
  },

  "levadiakos": {
    teamKey: "levadiakos",
    name: "Levadiakos",
    country: GREECE,
    city: "Livadeia",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "levadia-municipal-stadium",
    founded: 1961,
    clubColors: ["green", "blue"],
    aliases: ["levadiakos fc"],
  },

  "kifisia": {
    teamKey: "kifisia",
    name: "Kifisia",
    country: GREECE,
    city: "Athens",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "zirineio-stadium",
    founded: 2012,
    clubColors: ["white", "blue"],
    aliases: ["ae kifisia", "kifisia fc"],
  },

  "panetolikos": {
    teamKey: "panetolikos",
    name: "Panetolikos",
    country: GREECE,
    city: "Agrinio",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "panetolikos-stadium",
    founded: 1926,
    clubColors: ["yellow", "blue"],
    aliases: ["panaitolikos", "panetolikos fc"],
  },

  "ael": {
    teamKey: "ael",
    name: "AEL",
    country: GREECE,
    city: "Larissa",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "alkazar-stadium",
    founded: 1964,
    clubColors: ["crimson", "white"],
    aliases: ["ael larissa", "larissa"],
  },

  "panserraikos": {
    teamKey: "panserraikos",
    name: "Panserraikos",
    country: GREECE,
    city: "Serres",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "serres-municipal-stadium",
    founded: 1964,
    clubColors: ["red", "white"],
    aliases: ["panserraikos fc"],
  },
};

export default superLeagueGreeceTeams;
