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
    aliases: ["olympiacos fc"],
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
    aliases: ["aek"],
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
    aliases: ["aris fc"],
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
    aliases: ["asteras"],
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

  "lamia": {
    teamKey: "lamia",
    name: "Lamia",
    country: GREECE,
    city: "Lamia",
    leagueId: SUPER_LEAGUE_GREECE,
    stadiumKey: "lamia-municipal-stadium",
    founded: 1964,
    clubColors: ["blue", "white"],
    aliases: ["pas lamia"],
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
    aliases: ["ofi fc"],
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
    aliases: ["volos nfc"],
  },

};

export default superLeagueGreeceTeams;
