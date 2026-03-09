import type { TeamRecord } from "./types";

const AUSTRIAN_BUNDESLIGA = 218;
const AUSTRIA = "Austria";

export const austrianBundesligaTeams: Record<string, TeamRecord> = {
  "red-bull-salzburg": {
    teamKey: "red-bull-salzburg",
    name: "Red Bull Salzburg",
    country: AUSTRIA,
    city: "Salzburg",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "red-bull-arena-salzburg",
    founded: 1933,
    clubColors: ["red", "white"],
    aliases: ["salzburg", "fc red bull salzburg"],
  },

  "rapid-vienna": {
    teamKey: "rapid-vienna",
    name: "Rapid Vienna",
    country: AUSTRIA,
    city: "Vienna",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "allianz-stadion-vienna",
    founded: 1899,
    clubColors: ["green", "white"],
    aliases: ["rapid wien", "sk rapid wien"],
  },

  "austria-vienna": {
    teamKey: "austria-vienna",
    name: "Austria Vienna",
    country: AUSTRIA,
    city: "Vienna",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "generali-arena",
    founded: 1911,
    clubColors: ["violet", "white"],
    aliases: ["austria wien", "fk austria wien"],
  },

  "sturm-graz": {
    teamKey: "sturm-graz",
    name: "Sturm Graz",
    country: AUSTRIA,
    city: "Graz",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "merkur-arena-graz",
    founded: 1909,
    clubColors: ["black", "white"],
    aliases: ["sk sturm graz"],
  },

  "lask": {
    teamKey: "lask",
    name: "LASK",
    country: AUSTRIA,
    city: "Linz",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "raiffeisen-arena-linz",
    founded: 1908,
    clubColors: ["black", "white"],
    aliases: ["lask linz"],
  },

  "wolfsberger": {
    teamKey: "wolfsberger",
    name: "Wolfsberger AC",
    country: AUSTRIA,
    city: "Wolfsberg",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "lavanttal-arena",
    founded: 1931,
    clubColors: ["black", "white"],
    aliases: ["wac", "wolfsberger ac"],
  },

  "hartberg": {
    teamKey: "hartberg",
    name: "Hartberg",
    country: AUSTRIA,
    city: "Hartberg",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "profertil-arena-hartberg",
    founded: 1946,
    clubColors: ["blue", "white"],
    aliases: ["tsv hartberg"],
  },

  "bw-linz": {
    teamKey: "bw-linz",
    name: "Blau-Weiß Linz",
    country: AUSTRIA,
    city: "Linz",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "hofmann-personal-stadion",
    founded: 1997,
    clubColors: ["blue", "white"],
    aliases: ["blau weiss linz", "fc blau-weiss linz"],
  },

  "altach": {
    teamKey: "altach",
    name: "Altach",
    country: AUSTRIA,
    city: "Altach",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "cashpoint-arena",
    founded: 1929,
    clubColors: ["black", "white"],
    aliases: ["rheindorf altach", "scr altach"],
  },

  "tirol": {
    teamKey: "tirol",
    name: "WSG Tirol",
    country: AUSTRIA,
    city: "Innsbruck",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "tivoli-stadion-tirol",
    founded: 1930,
    clubColors: ["green", "white"],
    aliases: ["wsg tirol"],
  },

  "grazer-ak": {
    teamKey: "grazer-ak",
    name: "Grazer AK",
    country: AUSTRIA,
    city: "Graz",
    leagueId: AUSTRIAN_BUNDESLIGA,
    stadiumKey: "merkur-arena-graz",
    founded: 1902,
    clubColors: ["red", "white"],
    aliases: ["gak", "grazer ak 1902"],
  },

  "ried": {
  teamKey: "ried",
  name: "SV Ried",
  country: AUSTRIA,
  city: "Ried im Innkreis",
  leagueId: AUSTRIAN_BUNDESLIGA,
  stadiumKey: "josko-arena",
  founded: 1912,
  clubColors: ["green", "black"],
  aliases: ["sv ried"],
},
};

export default austrianBundesligaTeams;
