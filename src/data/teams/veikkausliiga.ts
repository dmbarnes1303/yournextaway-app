// src/data/teams/veikkausliiga.ts
import type { TeamRecord } from "./types";

const VEIKKAUSLIIGA = 244;
const FINLAND = "Finland";

export const veikkausliigaTeams: Record<string, TeamRecord> = {
  "ac-oulu": {
    teamKey: "ac-oulu",
    name: "AC Oulu",
    country: FINLAND,
    city: "Oulu",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "raatti-stadium",
    aliases: ["oulu", "ac oulu"],
  },

  "inter-turku": {
    teamKey: "inter-turku",
    name: "FC Inter Turku",
    country: FINLAND,
    city: "Turku",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "veritas-stadion",
    aliases: ["inter", "inter turku", "fc inter", "fc inter turku"],
  },

  "fc-lahti": {
    teamKey: "fc-lahti",
    name: "FC Lahti",
    country: FINLAND,
    city: "Lahti",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "lahti-stadium",
    aliases: ["lahti", "fc lahti"],
  },

  "ff-jaro": {
    teamKey: "ff-jaro",
    name: "FF Jaro",
    country: FINLAND,
    city: "Pietarsaari",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "project-liv-arena",
    aliases: ["jaro", "ff jaro"],
  },

  "hjk": {
    teamKey: "hjk",
    name: "HJK",
    country: FINLAND,
    city: "Helsinki",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "bolt-arena",
    aliases: ["hjk helsinki", "helsingin jalkapalloklubi"],
  },

  "gnistan": {
    teamKey: "gnistan",
    name: "Gnistan",
    country: FINLAND,
    city: "Helsinki",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "mustapekka-areena",
    aliases: ["if gnistan", "gnistan helsinki"],
  },

  "ifk-mariehamn": {
    teamKey: "ifk-mariehamn",
    name: "IFK Mariehamn",
    country: FINLAND,
    city: "Mariehamn",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "wiklof-holding-arena",
    aliases: ["mariehamn", "ifk mariehamn"],
  },

  "ilves": {
    teamKey: "ilves",
    name: "Ilves",
    country: FINLAND,
    city: "Tampere",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "tammelan-stadion",
    aliases: ["ilves tampere"],
  },

  "kups": {
    teamKey: "kups",
    name: "KuPS",
    country: FINLAND,
    city: "Kuopio",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "vare-areena",
    aliases: ["kups kuopio", "kuopion palloseura"],
  },

  "sjk": {
    teamKey: "sjk",
    name: "SJK",
    country: FINLAND,
    city: "Seinäjoki",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "omasp-stadion",
    aliases: ["seinajoen jk", "sjk seinajoki", "seinäjoen jk"],
  },

  "tps": {
    teamKey: "tps",
    name: "Turun Palloseura",
    country: FINLAND,
    city: "Turku",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "veritas-stadion",
    aliases: ["tps", "turun", "turun palloseura"],
  },

  "vps": {
    teamKey: "vps",
    name: "VPS",
    country: FINLAND,
    city: "Vaasa",
    leagueId: VEIKKAUSLIIGA,
    stadiumKey: "lemonsoft-stadion",
    aliases: ["vaasan palloseura", "vaasa ps", "vps vaasa"],
  },
};

export default veikkausliigaTeams;
