import type { TeamRecord } from "./types";

const SWISS_SUPER_LEAGUE = 207;
const SWITZERLAND = "Switzerland";

export const swissSuperLeagueTeams: Record<string, TeamRecord> = {
  "young-boys": {
    teamKey: "young-boys",
    name: "Young Boys",
    country: SWITZERLAND,
    city: "Bern",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "wankdorf",
    founded: 1898,
    clubColors: ["yellow", "black"],
    aliases: ["bsc young boys"],
  },

  "basel": {
    teamKey: "basel",
    name: "Basel",
    country: SWITZERLAND,
    city: "Basel",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "st-jakob-park",
    founded: 1893,
    clubColors: ["red", "blue"],
    aliases: ["fc basel"],
  },

  "zurich": {
    teamKey: "zurich",
    name: "FC Zürich",
    country: SWITZERLAND,
    city: "Zurich",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "letzigrund",
    founded: 1896,
    clubColors: ["blue", "white"],
    aliases: ["fc zurich", "zuerich"],
  },

  "grasshoppers": {
    teamKey: "grasshoppers",
    name: "Grasshoppers",
    country: SWITZERLAND,
    city: "Zurich",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "letzigrund",
    founded: 1886,
    clubColors: ["blue", "white"],
    aliases: ["grasshopper club zurich", "gc zurich"],
  },

  "servette": {
    teamKey: "servette",
    name: "Servette",
    country: SWITZERLAND,
    city: "Geneva",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "stade-de-geneve",
    founded: 1890,
    clubColors: ["maroon"],
    aliases: ["servette fc"],
  },

  "lausanne-sport": {
    teamKey: "lausanne-sport",
    name: "Lausanne-Sport",
    country: SWITZERLAND,
    city: "Lausanne",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "stade-de-la-tuiliere",
    founded: 1896,
    clubColors: ["blue", "white"],
    aliases: ["lausanne sport"],
  },

  "lugano": {
    teamKey: "lugano",
    name: "Lugano",
    country: SWITZERLAND,
    city: "Lugano",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "stadio-cornaredo",
    founded: 1908,
    clubColors: ["black", "white"],
    aliases: ["fc lugano"],
  },

  "st-gallen": {
    teamKey: "st-gallen",
    name: "St. Gallen",
    country: SWITZERLAND,
    city: "St. Gallen",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "kybunpark",
    founded: 1879,
    clubColors: ["green", "white"],
    aliases: ["fc st gallen", "st gallen"],
  },

  "lucerne": {
    teamKey: "lucerne",
    name: "Lucerne",
    country: SWITZERLAND,
    city: "Lucerne",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "swissporarena",
    founded: 1901,
    clubColors: ["blue", "white"],
    aliases: ["fc luzern", "luzern"],
  },

  "winterthur": {
    teamKey: "winterthur",
    name: "Winterthur",
    country: SWITZERLAND,
    city: "Winterthur",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "schutzenwiese",
    founded: 1896,
    clubColors: ["red", "white"],
    aliases: ["fc winterthur"],
  },

  "sion": {
    teamKey: "sion",
    name: "Sion",
    country: SWITZERLAND,
    city: "Sion",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "tourbillon",
    founded: 1909,
    clubColors: ["red", "white"],
    aliases: ["fc sion"],
  },

  "thun": {
    teamKey: "thun",
    name: "Thun",
    country: SWITZERLAND,
    city: "Thun",
    leagueId: SWISS_SUPER_LEAGUE,
    stadiumKey: "stockhorn-arena",
    founded: 1898,
    clubColors: ["red", "white"],
    aliases: ["fc thun"],
  },
};

export default swissSuperLeagueTeams;
