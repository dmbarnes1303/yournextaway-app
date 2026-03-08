import type { TeamRecord } from "./types";

const ELITESERIEN = 103;
const NORWAY = "Norway";

export const eliteserienTeams: Record<string, TeamRecord> = {
  "aalesund": {
    teamKey: "aalesund",
    name: "Aalesund",
    country: NORWAY,
    city: "Ålesund",
    leagueId: ELITESERIEN,
    stadiumKey: "color-line-stadion",
    aliases: ["aalesunds fk", "alesund", "ålesund", "aafk"],
  },

  "bodo-glimt": {
    teamKey: "bodo-glimt",
    name: "Bodø/Glimt",
    country: NORWAY,
    city: "Bodø",
    leagueId: ELITESERIEN,
    stadiumKey: "aspmyra-stadion",
    aliases: ["bodo glimt", "fk bodo glimt", "bodoe glimt", "bodø glimt", "glimt"],
  },

  "brann": {
    teamKey: "brann",
    name: "Brann",
    country: NORWAY,
    city: "Bergen",
    leagueId: ELITESERIEN,
    stadiumKey: "brann-stadion",
    aliases: ["sk brann", "brann bergen"],
  },

  "fredrikstad": {
    teamKey: "fredrikstad",
    name: "Fredrikstad",
    country: NORWAY,
    city: "Fredrikstad",
    leagueId: ELITESERIEN,
    stadiumKey: "fredrikstad-stadion",
    aliases: ["fredrikstad fk", "ffk"],
  },

  "hamkam": {
    teamKey: "hamkam",
    name: "HamKam",
    country: NORWAY,
    city: "Hamar",
    leagueId: ELITESERIEN,
    stadiumKey: "briskeby-arena",
    aliases: ["hamar kam", "ham-kam"],
  },

  "kfum-oslo": {
    teamKey: "kfum-oslo",
    name: "KFUM Oslo",
    country: NORWAY,
    city: "Oslo",
    leagueId: ELITESERIEN,
    stadiumKey: "kfum-arena",
    aliases: ["kfum", "kfum-kameratene oslo"],
  },

  "kristiansund": {
    teamKey: "kristiansund",
    name: "Kristiansund",
    country: NORWAY,
    city: "Kristiansund",
    leagueId: ELITESERIEN,
    stadiumKey: "nordmore-stadion",
    aliases: ["kristiansund bk", "kbk"],
  },

  "lillestrom": {
    teamKey: "lillestrom",
    name: "Lillestrøm",
    country: NORWAY,
    city: "Lillestrøm",
    leagueId: ELITESERIEN,
    stadiumKey: "arasen-stadion",
    aliases: ["lillestrom sk", "lsk", "lillestrøm"],
  },

  "molde": {
    teamKey: "molde",
    name: "Molde",
    country: NORWAY,
    city: "Molde",
    leagueId: ELITESERIEN,
    stadiumKey: "aker-stadion",
    aliases: ["molde fk", "mfk"],
  },

  "rosenborg": {
    teamKey: "rosenborg",
    name: "Rosenborg",
    country: NORWAY,
    city: "Trondheim",
    leagueId: ELITESERIEN,
    stadiumKey: "lerkendal-stadion",
    aliases: ["rosenborg bk", "rbk"],
  },

  "sandefjord": {
    teamKey: "sandefjord",
    name: "Sandefjord",
    country: NORWAY,
    city: "Sandefjord",
    leagueId: ELITESERIEN,
    stadiumKey: "jotun-arena",
    aliases: ["sandefjord fotball", "sf"],
  },

  "sarpsborg-08": {
    teamKey: "sarpsborg-08",
    name: "Sarpsborg 08",
    country: NORWAY,
    city: "Sarpsborg",
    leagueId: ELITESERIEN,
    stadiumKey: "sarpsborg-stadion",
    aliases: ["sarpsborg", "sarpsborg 08 ff", "s08"],
  },

  "start": {
    teamKey: "start",
    name: "Start",
    country: NORWAY,
    city: "Kristiansand",
    leagueId: ELITESERIEN,
    stadiumKey: "sor-arena",
    aliases: ["ik start", "start kristiansand"],
  },

  "tromso": {
    teamKey: "tromso",
    name: "Tromsø",
    country: NORWAY,
    city: "Tromsø",
    leagueId: ELITESERIEN,
    stadiumKey: "romssa-arena",
    aliases: ["tromso il", "tromsø", "til"],
  },

  "valerenga": {
    teamKey: "valerenga",
    name: "Vålerenga",
    country: NORWAY,
    city: "Oslo",
    leagueId: ELITESERIEN,
    stadiumKey: "intility-arena",
    aliases: ["valerenga fotball", "vålerenga", "vif"],
  },

  "viking": {
    teamKey: "viking",
    name: "Viking",
    country: NORWAY,
    city: "Stavanger",
    leagueId: ELITESERIEN,
    stadiumKey: "sr-bank-arena",
    aliases: ["viking fk"],
  },
};

export default eliteserienTeams;
