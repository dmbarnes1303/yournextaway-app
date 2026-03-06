import type { StadiumRecord } from "./types";

const ekstraklasaStadiums: Record<string, StadiumRecord> = {

  "polish-army-stadium": {
    stadiumKey: "polish-army-stadium",
    name: "Polish Army Stadium",
    city: "Warsaw",
    country: "Poland",
    capacity: 31500,
    opened: 1930,
    teamKeys: ["legia-warsaw"],
  },

  "poznan-stadium": {
    stadiumKey: "poznan-stadium",
    name: "Poznań Stadium",
    city: "Poznań",
    country: "Poland",
    capacity: 41609,
    opened: 1980,
    teamKeys: ["lech-poznan"],
  },

  "rakow-stadium": {
    stadiumKey: "rakow-stadium",
    name: "Raków Stadium",
    city: "Częstochowa",
    country: "Poland",
    capacity: 5500,
    opened: 1955,
    teamKeys: ["rakow"],
  },

  "florian-krygier-stadium": {
    stadiumKey: "florian-krygier-stadium",
    name: "Florian Krygier Stadium",
    city: "Szczecin",
    country: "Poland",
    capacity: 21163,
    opened: 1925,
    teamKeys: ["pogon-szczecin"],
  },

  "polsat-plus-arena": {
    stadiumKey: "polsat-plus-arena",
    name: "Polsat Plus Arena",
    city: "Gdańsk",
    country: "Poland",
    capacity: 41620,
    opened: 2011,
    teamKeys: ["lechia-gdansk"],
  },

  "arena-zabrze": {
    stadiumKey: "arena-zabrze",
    name: "Arena Zabrze",
    city: "Zabrze",
    country: "Poland",
    capacity: 24563,
    opened: 1934,
    teamKeys: ["gornik-zabrze"],
  },

  "bialystok-city-stadium": {
    stadiumKey: "bialystok-city-stadium",
    name: "Białystok City Stadium",
    city: "Białystok",
    country: "Poland",
    capacity: 22372,
    opened: 2014,
    teamKeys: ["jagiellonia"],
  },

  "marshal-pilsudski-stadium": {
    stadiumKey: "marshal-pilsudski-stadium",
    name: "Marshal Józef Piłsudski Stadium",
    city: "Kraków",
    country: "Poland",
    capacity: 15016,
    opened: 1912,
    teamKeys: ["cracovia"],
  },

  "gliwice-arena": {
    stadiumKey: "gliwice-arena",
    name: "Stadion Miejski Gliwice",
    city: "Gliwice",
    country: "Poland",
    capacity: 10037,
    opened: 2011,
    teamKeys: ["piast-gliwice"],
  },

  "widzew-stadium": {
    stadiumKey: "widzew-stadium",
    name: "Widzew Stadium",
    city: "Łódź",
    country: "Poland",
    capacity: 18018,
    opened: 2017,
    teamKeys: ["widzew-lodz"],
  },

};

export default ekstraklasaStadiums;
