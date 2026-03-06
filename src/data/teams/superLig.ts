import type { TeamRecord } from "./types";

const SUPER_LIG = 203;
const TURKEY = "Turkey";

export const superLigTeams: Record<string, TeamRecord> = {

  "galatasaray": {
    teamKey: "galatasaray",
    name: "Galatasaray",
    country: TURKEY,
    city: "Istanbul",
    leagueId: SUPER_LIG,
    stadiumKey: "ram-park",
    founded: 1905,
    clubColors: ["red", "yellow"],
    aliases: ["galatasaray sk"],
  },

  "fenerbahce": {
    teamKey: "fenerbahce",
    name: "Fenerbahçe",
    country: TURKEY,
    city: "Istanbul",
    leagueId: SUPER_LIG,
    stadiumKey: "sukru-saracoglu",
    founded: 1907,
    clubColors: ["yellow", "navy"],
    aliases: ["fenerbahce sk"],
  },

  "besiktas": {
    teamKey: "besiktas",
    name: "Beşiktaş",
    country: TURKEY,
    city: "Istanbul",
    leagueId: SUPER_LIG,
    stadiumKey: "vodafone-park",
    founded: 1903,
    clubColors: ["black", "white"],
    aliases: ["besiktas jk"],
  },

  "trabzonspor": {
    teamKey: "trabzonspor",
    name: "Trabzonspor",
    country: TURKEY,
    city: "Trabzon",
    leagueId: SUPER_LIG,
    stadiumKey: "papara-park",
    founded: 1967,
    clubColors: ["claret", "blue"],
    aliases: ["trabzonspor kulubu"],
  },

  "istanbul-basaksehir": {
    teamKey: "istanbul-basaksehir",
    name: "Istanbul Basaksehir",
    country: TURKEY,
    city: "Istanbul",
    leagueId: SUPER_LIG,
    stadiumKey: "basaksehir-fatih-terim-stadium",
    founded: 1990,
    clubColors: ["orange", "navy"],
    aliases: ["basaksehir"],
  },

  "konyaspor": {
    teamKey: "konyaspor",
    name: "Konyaspor",
    country: TURKEY,
    city: "Konya",
    leagueId: SUPER_LIG,
    stadiumKey: "konya-buyuksehir-stadium",
    founded: 1922,
    clubColors: ["green", "white"],
    aliases: ["atiker konyaspor"],
  },

  "sivasspor": {
    teamKey: "sivasspor",
    name: "Sivasspor",
    country: TURKEY,
    city: "Sivas",
    leagueId: SUPER_LIG,
    stadiumKey: "sivas-4-eylul-stadium",
    founded: 1967,
    clubColors: ["red", "white"],
    aliases: ["demir grup sivasspor"],
  },

  "kayserispor": {
    teamKey: "kayserispor",
    name: "Kayserispor",
    country: TURKEY,
    city: "Kayseri",
    leagueId: SUPER_LIG,
    stadiumKey: "kadir-has-stadium",
    founded: 1966,
    clubColors: ["yellow", "red"],
    aliases: ["hes kablo kayserispor"],
  },

  "gaziantep": {
    teamKey: "gaziantep",
    name: "Gaziantep FK",
    country: TURKEY,
    city: "Gaziantep",
    leagueId: SUPER_LIG,
    stadiumKey: "kalyon-stadium",
    founded: 1988,
    clubColors: ["red", "black"],
    aliases: ["gaziantep fk"],
  },

  "antalya": {
    teamKey: "antalya",
    name: "Antalyaspor",
    country: TURKEY,
    city: "Antalya",
    leagueId: SUPER_LIG,
    stadiumKey: "antalya-stadium",
    founded: 1966,
    clubColors: ["red", "white"],
    aliases: ["antalyaspor"],
  },

  "adana-demirspor": {
    teamKey: "adana-demirspor",
    name: "Adana Demirspor",
    country: TURKEY,
    city: "Adana",
    leagueId: SUPER_LIG,
    stadiumKey: "yeni-adana-stadium",
    founded: 1940,
    clubColors: ["blue"],
    aliases: ["demirspor"],
  },

  "hatayspor": {
    teamKey: "hatayspor",
    name: "Hatayspor",
    country: TURKEY,
    city: "Antakya",
    leagueId: SUPER_LIG,
    stadiumKey: "hatay-stadium",
    founded: 1967,
    clubColors: ["claret", "white"],
    aliases: ["atakas hatayspor"],
  },

  "alanyaspor": {
    teamKey: "alanyaspor",
    name: "Alanyaspor",
    country: TURKEY,
    city: "Alanya",
    leagueId: SUPER_LIG,
    stadiumKey: "bahcesehir-okullari-stadium",
    founded: 1948,
    clubColors: ["orange", "green"],
    aliases: ["alanyaspor"],
  },

  "samsunspor": {
    teamKey: "samsunspor",
    name: "Samsunspor",
    country: TURKEY,
    city: "Samsun",
    leagueId: SUPER_LIG,
    stadiumKey: "samsun-19-mayis-stadium",
    founded: 1965,
    clubColors: ["red", "white"],
    aliases: ["samsunspor"],
  },

  "rizespor": {
    teamKey: "rizespor",
    name: "Rizespor",
    country: TURKEY,
    city: "Rize",
    leagueId: SUPER_LIG,
    stadiumKey: "caykur-didi-stadium",
    founded: 1953,
    clubColors: ["green", "blue"],
    aliases: ["caykur rizespor"],
  },

  "ankaragucu": {
    teamKey: "ankaragucu",
    name: "Ankaragucu",
    country: TURKEY,
    city: "Ankara",
    leagueId: SUPER_LIG,
    stadiumKey: "eryaman-stadium",
    founded: 1910,
    clubColors: ["yellow", "navy"],
    aliases: ["mke ankaragucu"],
  },

  "kasimpasa": {
    teamKey: "kasimpasa",
    name: "Kasimpasa",
    country: TURKEY,
    city: "Istanbul",
    leagueId: SUPER_LIG,
    stadiumKey: "recep-tayyip-erdogan-stadium",
    founded: 1921,
    clubColors: ["blue", "white"],
    aliases: ["kasimpasa sk"],
  },

  "pendikspor": {
    teamKey: "pendikspor",
    name: "Pendikspor",
    country: TURKEY,
    city: "Istanbul",
    leagueId: SUPER_LIG,
    stadiumKey: "pendik-stadium",
    founded: 1950,
    clubColors: ["red", "white"],
    aliases: ["pendikspor"],
  }

};

export default superLigTeams;
