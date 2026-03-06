import type { TeamRecord } from "./types";

const EKSTRAKLASA = 106;
const POLAND = "Poland";

export const ekstraklasaTeams: Record<string, TeamRecord> = {

  "legia-warsaw": {
    teamKey: "legia-warsaw",
    name: "Legia Warsaw",
    country: POLAND,
    city: "Warsaw",
    leagueId: EKSTRAKLASA,
    stadiumKey: "polish-army-stadium",
    founded: 1916,
    clubColors: ["green", "white"],
    aliases: ["legia warszawa"],
  },

  "lech-poznan": {
    teamKey: "lech-poznan",
    name: "Lech Poznań",
    country: POLAND,
    city: "Poznań",
    leagueId: EKSTRAKLASA,
    stadiumKey: "poznan-stadium",
    founded: 1922,
    clubColors: ["blue", "white"],
    aliases: ["kks lech poznan"],
  },

  "rakow": {
    teamKey: "rakow",
    name: "Raków Częstochowa",
    country: POLAND,
    city: "Częstochowa",
    leagueId: EKSTRAKLASA,
    stadiumKey: "rakow-stadium",
    founded: 1921,
    clubColors: ["red", "blue"],
    aliases: ["rakow czestochowa"],
  },

  "pogon-szczecin": {
    teamKey: "pogon-szczecin",
    name: "Pogoń Szczecin",
    country: POLAND,
    city: "Szczecin",
    leagueId: EKSTRAKLASA,
    stadiumKey: "florian-krygier-stadium",
    founded: 1948,
    clubColors: ["navy", "red"],
    aliases: ["pogón szczecin"],
  },

  "lechia-gdansk": {
    teamKey: "lechia-gdansk",
    name: "Lechia Gdańsk",
    country: POLAND,
    city: "Gdańsk",
    leagueId: EKSTRAKLASA,
    stadiumKey: "polsat-plus-arena",
    founded: 1945,
    clubColors: ["green", "white"],
    aliases: ["lechia"],
  },

  "gornik-zabrze": {
    teamKey: "gornik-zabrze",
    name: "Górnik Zabrze",
    country: POLAND,
    city: "Zabrze",
    leagueId: EKSTRAKLASA,
    stadiumKey: "arena-zabrze",
    founded: 1948,
    clubColors: ["blue", "white"],
    aliases: ["gornik"],
  },

  "jagiellonia": {
    teamKey: "jagiellonia",
    name: "Jagiellonia Białystok",
    country: POLAND,
    city: "Białystok",
    leagueId: EKSTRAKLASA,
    stadiumKey: "bialystok-city-stadium",
    founded: 1920,
    clubColors: ["yellow", "red"],
    aliases: ["jagiellonia"],
  },

  "cracovia": {
    teamKey: "cracovia",
    name: "Cracovia",
    country: POLAND,
    city: "Kraków",
    leagueId: EKSTRAKLASA,
    stadiumKey: "marshal-pilsudski-stadium",
    founded: 1906,
    clubColors: ["red", "white"],
    aliases: ["ks cracovia"],
  },

  "piast-gliwice": {
    teamKey: "piast-gliwice",
    name: "Piast Gliwice",
    country: POLAND,
    city: "Gliwice",
    leagueId: EKSTRAKLASA,
    stadiumKey: "gliwice-arena",
    founded: 1945,
    clubColors: ["blue", "red"],
    aliases: ["piast"],
  },

  "widzew-lodz": {
    teamKey: "widzew-lodz",
    name: "Widzew Łódź",
    country: POLAND,
    city: "Łódź",
    leagueId: EKSTRAKLASA,
    stadiumKey: "widzew-stadium",
    founded: 1910,
    clubColors: ["red"],
    aliases: ["widzew"],
  },

};

export default ekstraklasaTeams;
