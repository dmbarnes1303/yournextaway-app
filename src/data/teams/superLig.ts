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

  "istanbul-basaksehir": {
    teamKey: "istanbul-basaksehir",
    name: "Istanbul Basaksehir",
    country: TURKEY,
    city: "Istanbul",
    leagueId: SUPER_LIG,
    stadiumKey: "basaksehir-fatih-terim-stadium",
    founded: 1990,
    clubColors: ["orange", "navy"],
    aliases: ["basaksehir", "istanbul basaksehir fk"],
  },

  "goztepe": {
    teamKey: "goztepe",
    name: "Göztepe",
    country: TURKEY,
    city: "Izmir",
    leagueId: SUPER_LIG,
    stadiumKey: "gursel-aksel-stadium",
    founded: 1925,
    clubColors: ["yellow", "red"],
    aliases: ["goztepe sk", "göztepe sk"],
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

  "kocaelispor": {
    teamKey: "kocaelispor",
    name: "Kocaelispor",
    country: TURKEY,
    city: "Izmit",
    leagueId: SUPER_LIG,
    stadiumKey: "yildiz-entegre-kocaeli-stadium",
    founded: 1966,
    clubColors: ["green", "black"],
    aliases: ["kocaelispor"],
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

  "genclerbirligi": {
    teamKey: "genclerbirligi",
    name: "Gençlerbirliği",
    country: TURKEY,
    city: "Ankara",
    leagueId: SUPER_LIG,
    stadiumKey: "eryaman-stadium",
    founded: 1923,
    clubColors: ["red", "black"],
    aliases: ["genclerbirligi", "gençlerbirliği sk"],
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
    aliases: ["atiker konyaspor", "tümosan konyaspor"],
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

  "eyupspor": {
    teamKey: "eyupspor",
    name: "Eyüpspor",
    country: TURKEY,
    city: "Istanbul",
    leagueId: SUPER_LIG,
    stadiumKey: "eyup-stadium",
    founded: 1919,
    clubColors: ["purple", "yellow"],
    aliases: ["eyupspor", "eyüpspor"],
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
    aliases: ["kasimpasa sk", "kasımpaşa"],
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
    aliases: ["kayserispor", "mondihome kayserispor"],
  },

  "fatih-karagumruk": {
    teamKey: "fatih-karagumruk",
    name: "Fatih Karagümrük",
    country: TURKEY,
    city: "Istanbul",
    leagueId: SUPER_LIG,
    stadiumKey: "ataturk-olimpiyat-stadium",
    founded: 1926,
    clubColors: ["black", "red"],
    aliases: ["fatih karagumruk", "fatih karagümrük sk"],
  },
};

export default superLigTeams;
