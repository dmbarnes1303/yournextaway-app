import type { TeamRecord } from "./types";

const CROATIA = "Croatia";
const HNL = 210;

export const hnlTeams: Record<string, TeamRecord> = {
  "dinamo-zagreb": {
    teamKey: "dinamo-zagreb",
    name: "Dinamo Zagreb",
    city: "Zagreb",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "maksimir-stadium",
    founded: 1911,
    clubColors: ["blue", "white"],
    aliases: ["gnk dinamo zagreb", "dinamo", "dinamo zagreb"],
  },

  "hajduk-split": {
    teamKey: "hajduk-split",
    name: "Hajduk Split",
    city: "Split",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-poljud",
    founded: 1911,
    clubColors: ["white", "blue"],
    aliases: ["hnk hajduk split", "hajduk", "hajduk split"],
  },

  rijeka: {
    teamKey: "rijeka",
    name: "HNK Rijeka",
    city: "Rijeka",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-rujevica",
    founded: 1906,
    clubColors: ["white", "light-blue"],
    aliases: ["rijeka", "hnk rijeka"],
  },

  "slaven-belupo": {
    teamKey: "slaven-belupo",
    name: "Slaven Belupo",
    city: "Koprivnica",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "gradski-stadion-koprivnica",
    founded: 1907,
    clubColors: ["blue"],
    aliases: ["nk slaven belupo", "slaven", "slaven belupo"],
  },

  varazdin: {
    teamKey: "varazdin",
    name: "NK Varaždin",
    city: "Varaždin",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-varteks",
    founded: 2012,
    clubColors: ["orange", "blue"],
    aliases: ["varazdin", "nk varazdin", "nk varaždin"],
  },

  "istra-1961": {
    teamKey: "istra-1961",
    name: "NK Istra 1961",
    city: "Pula",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-aldo-drosina",
    founded: 2011,
    clubColors: ["green", "yellow"],
    aliases: ["istra", "istra 1961", "nk istra 1961"],
  },

  "nk-lokomotiva": {
    teamKey: "nk-lokomotiva",
    name: "NK Lokomotiva",
    city: "Zagreb",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "kajzerica-stadium",
    founded: 1914,
    clubColors: ["blue", "white"],
    aliases: ["lokomotiva", "nk lokomotiva", "lokomotiva zagreb"],
  },

  "hnk-gorica": {
    teamKey: "hnk-gorica",
    name: "HNK Gorica",
    city: "Velika Gorica",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-radnik",
    founded: 2008,
    clubColors: ["red", "black"],
    aliases: ["gorica", "hnk gorica", "gorica velika gorica"],
  },

  osijek: {
    teamKey: "osijek",
    name: "NK Osijek",
    city: "Osijek",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "opus-arena",
    founded: 1947,
    clubColors: ["blue", "white"],
    aliases: ["osijek", "nk osijek"],
  },

  "vukovar-1991": {
    teamKey: "vukovar-1991",
    name: "HNK Vukovar 1991",
    city: "Vukovar",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-borovo-naselje",
    founded: 2012,
    clubColors: ["blue", "white"],
    aliases: ["vukovar", "vukovar 1991", "hnk vukovar 1991"],
  },
};

export default hnlTeams;
