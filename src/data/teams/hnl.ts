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
    aliases: ["gnk dinamo zagreb", "dinamo", "dinamo zagreb"],
  },

  "hajduk-split": {
    teamKey: "hajduk-split",
    name: "Hajduk Split",
    city: "Split",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "poljud-stadium",
    aliases: ["hnk hajduk split", "hajduk", "hajduk split"],
  },

  "rijeka": {
    teamKey: "rijeka",
    name: "HNK Rijeka",
    city: "Rijeka",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-rujevica",
    aliases: ["rijeka", "hnk rijeka"],
  },

  "slaven-belupo": {
    teamKey: "slaven-belupo",
    name: "Slaven Belupo",
    city: "Koprivnica",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "gradski-stadion-koprivnica",
    aliases: ["nk slaven belupo", "slaven", "slaven belupo"],
  },

  "varazdin": {
    teamKey: "varazdin",
    name: "NK Varaždin",
    city: "Varaždin",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-varazdin",
    aliases: ["varazdin", "nk varazdin"],
  },

  "istra-1961": {
    teamKey: "istra-1961",
    name: "NK Istra 1961",
    city: "Pula",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-aldodrosina",
    aliases: ["istra", "istra 1961", "nk istra 1961"],
  },

  "nk-lokomotiva": {
    teamKey: "nk-lokomotiva",
    name: "NK Lokomotiva",
    city: "Zagreb",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "maksimir-stadium",
    aliases: ["lokomotiva", "nk lokomotiva", "lokomotiva zagreb"],
  },

  "hnk-gorica": {
    teamKey: "hnk-gorica",
    name: "HNK Gorica",
    city: "Velika Gorica",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-radnik",
    aliases: ["gorica", "hnk gorica", "gorica velika gorica"],
  },

  "osijek": {
    teamKey: "osijek",
    name: "NK Osijek",
    city: "Osijek",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "opus-arena",
    aliases: ["osijek", "nk osijek"],
  },

  "vukovar-1991": {
    teamKey: "vukovar-1991",
    name: "HNK Vukovar 1991",
    city: "Vukovar",
    country: CROATIA,
    leagueId: HNL,
    stadiumKey: "stadion-vukovar",
    aliases: ["vukovar", "vukovar 1991", "hnk vukovar 1991"],
  },
};

export default hnlTeams;
