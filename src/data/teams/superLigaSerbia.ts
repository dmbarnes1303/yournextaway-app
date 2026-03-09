import type { TeamRecord } from "./types";

const SUPER_LIGA = 286;
const SERBIA = "Serbia";

export const superLigaSerbiaTeams: Record<string, TeamRecord> = {
  "red-star-belgrade": {
    teamKey: "red-star-belgrade",
    name: "Red Star Belgrade",
    country: SERBIA,
    city: "Belgrade",
    leagueId: SUPER_LIGA,
    stadiumKey: "rajko-mitic-stadium",
    aliases: ["crvena zvezda", "fk crvena zvezda", "red star", "zvezda"],
  },

  "partizan": {
    teamKey: "partizan",
    name: "Partizan",
    country: SERBIA,
    city: "Belgrade",
    leagueId: SUPER_LIGA,
    stadiumKey: "partizan-stadium",
    aliases: ["fk partizan", "partizan belgrade"],
  },

  "vojvodina": {
    teamKey: "vojvodina",
    name: "Vojvodina Novi Sad",
    country: SERBIA,
    city: "Novi Sad",
    leagueId: SUPER_LIGA,
    stadiumKey: "karadjordje-stadium",
    aliases: ["vojvodina", "fk vojvodina", "vojvodina novi sad"],
  },

  "zeleznicar-pancevo": {
    teamKey: "zeleznicar-pancevo",
    name: "Železničar Pančevo",
    country: SERBIA,
    city: "Pančevo",
    leagueId: SUPER_LIGA,
    stadiumKey: "sc-mladost-stadium",
    aliases: ["zeleznicar", "fk zeleznicar pancevo", "zeleznicar pancevo"],
  },

  "novi-pazar": {
    teamKey: "novi-pazar",
    name: "Novi Pazar",
    country: SERBIA,
    city: "Novi Pazar",
    leagueId: SUPER_LIGA,
    stadiumKey: "novi-pazar-city-stadium",
    aliases: ["fk novi pazar", "novi pazar"],
  },

  "radnik-surdulica": {
    teamKey: "radnik-surdulica",
    name: "Radnik Surdulica",
    country: SERBIA,
    city: "Surdulica",
    leagueId: SUPER_LIGA,
    stadiumKey: "surdulica-city-stadium",
    aliases: ["radnik", "fk radnik surdulica", "radnik surdulica"],
  },

  "cukaricki": {
    teamKey: "cukaricki",
    name: "Čukarički",
    country: SERBIA,
    city: "Belgrade",
    leagueId: SUPER_LIGA,
    stadiumKey: "cukaricki-stadium",
    aliases: ["fk cukaricki", "cukaricki"],
  },

  "radnicki-nis": {
    teamKey: "radnicki-nis",
    name: "Radnički Niš",
    country: SERBIA,
    city: "Niš",
    leagueId: SUPER_LIGA,
    stadiumKey: "cair-stadium",
    aliases: ["fk radnicki nis", "radnicki nis"],
  },

  "ofk-beograd": {
  teamKey: "ofk-beograd",
  name: "OFK Beograd",
  country: SERBIA,
  city: "Belgrade",
  leagueId: SUPER_LIGA,
  stadiumKey: "omladinski-stadium",
  aliases: ["ofk beograd", "ofk belgrade"],
  },

  "radnicki-1923": {
    teamKey: "radnicki-1923",
    name: "Radnički 1923",
    country: SERBIA,
    city: "Kragujevac",
    leagueId: SUPER_LIGA,
    stadiumKey: "cika-daca-stadium",
    aliases: ["radnicki 1923", "fk radnicki 1923", "radnicki kragujevac"],
  },

  "tsc-backa-topola": {
    teamKey: "tsc-backa-topola",
    name: "TSC Bačka Topola",
    country: SERBIA,
    city: "Bačka Topola",
    leagueId: SUPER_LIGA,
    stadiumKey: "tsc-arena",
    aliases: ["tsc", "backa topola", "tsc backa topola"],
  },

  "imt": {
    teamKey: "imt",
    name: "IMT",
    country: SERBIA,
    city: "New Belgrade",
    leagueId: SUPER_LIGA,
    stadiumKey: "lagator-stadium",
    aliases: ["imt belgrade", "imt novi beograd", "fk imt"],
  },

  "javor": {
    teamKey: "javor",
    name: "Javor-Matis",
    country: SERBIA,
    city: "Ivanjica",
    leagueId: SUPER_LIGA,
    stadiumKey: "stadion-kraj-moravice",
    aliases: ["javor", "javor matis", "fk javor ivanjica"],
  },

  "mladost-lucani": {
    teamKey: "mladost-lucani",
    name: "Mladost Lučani",
    country: SERBIA,
    city: "Lučani",
    leagueId: SUPER_LIGA,
    stadiumKey: "src-mr-rados-milovanovic",
    aliases: ["mladost lucani", "fk mladost lucani"],
  },

  "spartak-subotica": {
    teamKey: "spartak-subotica",
    name: "Spartak Subotica",
    country: SERBIA,
    city: "Subotica",
    leagueId: SUPER_LIGA,
    stadiumKey: "subotica-city-stadium",
    aliases: ["spartak", "fk spartak subotica", "spartak zlatibor voda"],
  },

  "napredak": {
    teamKey: "napredak",
    name: "Napredak Kruševac",
    country: SERBIA,
    city: "Kruševac",
    leagueId: SUPER_LIGA,
    stadiumKey: "mladost-stadium-krusevac",
    aliases: ["napredak", "fk napredak", "napredak krusevac"],
  },
};

export default superLigaSerbiaTeams;
