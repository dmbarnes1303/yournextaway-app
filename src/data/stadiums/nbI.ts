import type { StadiumRecord } from "./types";

const HUNGARY = "Hungary";

export const nbIStadiums: Record<string, StadiumRecord> = {
  "eto-park": {
    stadiumKey: "eto-park",
    name: "ETO Park",
    city: "Győr",
    country: HUNGARY,
    capacity: 15800,
    opened: 2008,
    teamKeys: ["eto-gyor"],
    airport: "Vienna Airport (VIE)",
    distanceFromAirportKm: 110,
  },

  "groupama-arena": {
    stadiumKey: "groupama-arena",
    name: "Groupama Arena",
    city: "Budapest",
    country: HUNGARY,
    capacity: 22000,
    opened: 2014,
    teamKeys: ["ferencvaros"],
    airport: "Budapest Airport (BUD)",
    distanceFromAirportKm: 18,
  },

  "nagyerdei-stadion": {
    stadiumKey: "nagyerdei-stadion",
    name: "Nagyerdei Stadion",
    city: "Debrecen",
    country: HUNGARY,
    capacity: 20340,
    opened: 2014,
    teamKeys: ["debrecen"],
    airport: "Debrecen Airport (DEB)",
    distanceFromAirportKm: 10,
  },

  "vardai-stadion": {
    stadiumKey: "vardai-stadion",
    name: "Várkerti Stadion",
    city: "Kisvárda",
    country: HUNGARY,
    capacity: 2850,
    opened: 2018,
    teamKeys: ["kisvarda"],
    airport: "Debrecen Airport (DEB)",
    distanceFromAirportKm: 100,
  },

  "zte-arena": {
    stadiumKey: "zte-arena",
    name: "ZTE Arena",
    city: "Zalaegerszeg",
    country: HUNGARY,
    capacity: 11500,
    opened: 2002,
    teamKeys: ["zalaegerszeg"],
    airport: "Budapest Airport (BUD)",
    distanceFromAirportKm: 230,
  },

  "paks-stadion": {
    stadiumKey: "paks-stadion",
    name: "Paksi FC Stadion",
    city: "Paks",
    country: HUNGARY,
    capacity: 5000,
    opened: 1954,
    teamKeys: ["paks"],
    airport: "Budapest Airport (BUD)",
    distanceFromAirportKm: 115,
  },

  "pancho-arena": {
    stadiumKey: "pancho-arena",
    name: "Pancho Arena",
    city: "Felcsút",
    country: HUNGARY,
    capacity: 3816,
    opened: 2014,
    teamKeys: ["puskas-akademia"],
    airport: "Budapest Airport (BUD)",
    distanceFromAirportKm: 60,
  },

  "szusza-ferenc-stadion": {
    stadiumKey: "szusza-ferenc-stadion",
    name: "Szusza Ferenc Stadion",
    city: "Budapest",
    country: HUNGARY,
    capacity: 12500,
    opened: 1922,
    teamKeys: ["ujpest"],
    airport: "Budapest Airport (BUD)",
    distanceFromAirportKm: 22,
  },

  "varosi-stadion-nyiregyhaza": {
    stadiumKey: "varosi-stadion-nyiregyhaza",
    name: "Városi Stadion",
    city: "Nyíregyháza",
    country: HUNGARY,
    capacity: 8000,
    opened: 1958,
    teamKeys: ["nyiregyhaza"],
    airport: "Debrecen Airport (DEB)",
    distanceFromAirportKm: 60,
  },

  "hidegkuti-nandor-stadion": {
    stadiumKey: "hidegkuti-nandor-stadion",
    name: "Hidegkuti Nándor Stadion",
    city: "Budapest",
    country: HUNGARY,
    capacity: 5300,
    opened: 2016,
    teamKeys: ["mtk-budapest"],
    airport: "Budapest Airport (BUD)",
    distanceFromAirportKm: 20,
  },

  "dvtk-stadion": {
    stadiumKey: "dvtk-stadion",
    name: "DVTK Stadion",
    city: "Miskolc",
    country: HUNGARY,
    capacity: 15000,
    opened: 2018,
    teamKeys: ["diosgyor"],
    airport: "Budapest Airport (BUD)",
    distanceFromAirportKm: 190,
  },

  "kolorcity-arena": {
    stadiumKey: "kolorcity-arena",
    name: "Kolorcity Arena",
    city: "Kazincbarcika",
    country: HUNGARY,
    capacity: 5000,
    opened: 2020,
    teamKeys: ["kazincbarcika"],
    airport: "Budapest Airport (BUD)",
    distanceFromAirportKm: 200,
  },
};

export default nbIStadiums;
