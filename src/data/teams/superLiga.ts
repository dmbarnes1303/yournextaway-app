import type { TeamRecord } from "./types";

const SUPERLIGA = 283;
const ROMANIA = "Romania";

export const superLigaTeams: Record<string, TeamRecord> = {
  "universitatea-craiova": {
    teamKey: "universitatea-craiova",
    name: "Universitatea Craiova",
    country: ROMANIA,
    city: "Craiova",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-ion-oblemenko",
  },

  "rapid-bucuresti": {
    teamKey: "rapid-bucuresti",
    name: "Rapid București",
    country: ROMANIA,
    city: "Bucharest",
    leagueId: SUPERLIGA,
    stadiumKey: "superbet-arena-giulesti",
  },

  "u-cluj": {
    teamKey: "u-cluj",
    name: "Universitatea Cluj",
    country: ROMANIA,
    city: "Cluj-Napoca",
    leagueId: SUPERLIGA,
    stadiumKey: "cluj-arena",
  },

  "dinamo-bucuresti": {
    teamKey: "dinamo-bucuresti",
    name: "Dinamo București",
    country: ROMANIA,
    city: "Bucharest",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-arcul-de-triumf",
  },

  "cfr-cluj": {
    teamKey: "cfr-cluj",
    name: "CFR Cluj",
    country: ROMANIA,
    city: "Cluj-Napoca",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-dr-constantin-radulescu",
  },

  "arges-pitesti": {
    teamKey: "arges-pitesti",
    name: "Argeș Pitești",
    country: ROMANIA,
    city: "Pitești",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-nicolae-dobrin",
  },

  "fcsb": {
    teamKey: "fcsb",
    name: "FCSB",
    country: ROMANIA,
    city: "Bucharest",
    leagueId: SUPERLIGA,
    stadiumKey: "arena-nationala",
    aliases: ["steaua bucharest"],
  },

  "uta-arad": {
    teamKey: "uta-arad",
    name: "UTA Arad",
    country: ROMANIA,
    city: "Arad",
    leagueId: SUPERLIGA,
    stadiumKey: "arena-francisc-neuman",
  },

  "botosani": {
    teamKey: "botosani",
    name: "FC Botoșani",
    country: ROMANIA,
    city: "Botoșani",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-municipal-botosani",
  },

  "otelul-galati": {
    teamKey: "otelul-galati",
    name: "Oțelul Galați",
    country: ROMANIA,
    city: "Galați",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-otelul",
  },

  "farul-constanta": {
    teamKey: "farul-constanta",
    name: "Farul Constanța",
    country: ROMANIA,
    city: "Constanța",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-central-academia-hagi",
  },

  "petrolul-ploiesti": {
    teamKey: "petrolul-ploiesti",
    name: "Petrolul Ploiești",
    country: ROMANIA,
    city: "Ploiești",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-ilie-oana",
  },

  "csikszereda": {
    teamKey: "csikszereda",
    name: "Csíkszereda",
    country: ROMANIA,
    city: "Miercurea Ciuc",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-municipal-miercurea-ciuc",
  },

  "unirea-slobozia": {
    teamKey: "unirea-slobozia",
    name: "Unirea Slobozia",
    country: ROMANIA,
    city: "Slobozia",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-1-mai-slobozia",
  },

  "hermannstadt": {
    teamKey: "hermannstadt",
    name: "Hermannstadt",
    country: ROMANIA,
    city: "Sibiu",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-municipal-sibiu",
  },

  "metaloglobus": {
    teamKey: "metaloglobus",
    name: "Metaloglobus București",
    country: ROMANIA,
    city: "Bucharest",
    leagueId: SUPERLIGA,
    stadiumKey: "stadionul-metaloglobus",
  },
};

export default superLigaTeams;
