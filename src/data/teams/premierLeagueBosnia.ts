import type { TeamRecord } from "./types";

const BOSNIA = "Bosnia and Herzegovina";
const PREMIER_LEAGUE = 315;

export const premierLeagueBosniaTeams: Record<string, TeamRecord> = {
  "borac-banja-luka": {
    teamKey: "borac-banja-luka",
    name: "Borac Banja Luka",
    country: BOSNIA,
    city: "Banja Luka",
    leagueId: PREMIER_LEAGUE,
    aliases: ["borac", "fk borac", "borac banja luka"],
  },

  "zrinjski": {
    teamKey: "zrinjski",
    name: "Zrinjski Mostar",
    country: BOSNIA,
    city: "Mostar",
    leagueId: PREMIER_LEAGUE,
    aliases: ["zrinjski", "hsk zrinjski", "zrinjski mostar"],
  },

  "sarajevo": {
    teamKey: "sarajevo",
    name: "FK Sarajevo",
    country: BOSNIA,
    city: "Sarajevo",
    leagueId: PREMIER_LEAGUE,
    aliases: ["sarajevo", "fk sarajevo"],
  },

  "velez": {
    teamKey: "velez",
    name: "Velež Mostar",
    country: BOSNIA,
    city: "Mostar",
    leagueId: PREMIER_LEAGUE,
    aliases: ["velez", "fk velez", "velez mostar"],
  },

  "siroki-brijeg": {
    teamKey: "siroki-brijeg",
    name: "NK Široki Brijeg",
    country: BOSNIA,
    city: "Široki Brijeg",
    leagueId: PREMIER_LEAGUE,
    aliases: ["siroki", "nk siroki brijeg", "siroki brijeg"],
  },

  "zeljeznicar": {
    teamKey: "zeljeznicar",
    name: "Željezničar",
    country: BOSNIA,
    city: "Sarajevo",
    leagueId: PREMIER_LEAGUE,
    aliases: ["zeljeznicar", "fk zeljeznicar", "zeljeznicar sarajevo"],
  },

  "radnik-bijeljina": {
    teamKey: "radnik-bijeljina",
    name: "Radnik Bijeljina",
    country: BOSNIA,
    city: "Bijeljina",
    leagueId: PREMIER_LEAGUE,
    aliases: ["radnik", "radnik bijeljina"],
  },

  "posusje": {
    teamKey: "posusje",
    name: "Posušje",
    country: BOSNIA,
    city: "Posušje",
    leagueId: PREMIER_LEAGUE,
    aliases: ["nk posusje", "posusje"],
  },

  "rudar-prijedor": {
    teamKey: "rudar-prijedor",
    name: "Rudar Prijedor",
    country: BOSNIA,
    city: "Prijedor",
    leagueId: PREMIER_LEAGUE,
    aliases: ["rudar", "rudar prijedor"],
  },

  "sloga-doboj": {
    teamKey: "sloga-doboj",
    name: "Sloga Doboj",
    country: BOSNIA,
    city: "Doboj",
    leagueId: PREMIER_LEAGUE,
    aliases: ["sloga", "sloga doboj"],
  },
};

export default premierLeagueBosniaTeams;
