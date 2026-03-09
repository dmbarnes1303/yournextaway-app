// src/data/teams/primeiraLiga.ts

import type { TeamRecord } from "./types";

const PRIMEIRA_LIGA = 94;
const PORTUGAL = "Portugal";

export const primeiraLigaTeams: Record<string, TeamRecord> = {

  porto: {
    teamKey: "porto",
    name: "FC Porto",
    country: PORTUGAL,
    city: "Porto",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-do-dragao",
    founded: 1893,
    clubColors: ["blue", "white"],
    aliases: ["fc porto"],
  },

  sporting: {
    teamKey: "sporting",
    name: "Sporting CP",
    country: PORTUGAL,
    city: "Lisbon",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-jose-alvalade",
    founded: 1906,
    clubColors: ["green", "white"],
    aliases: ["sporting cp", "sporting lisbon"],
  },

  benfica: {
    teamKey: "benfica",
    name: "Benfica",
    country: PORTUGAL,
    city: "Lisbon",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-da-luz",
    founded: 1904,
    clubColors: ["red", "white"],
    aliases: ["sl benfica"],
  },

  braga: {
    teamKey: "braga",
    name: "Braga",
    country: PORTUGAL,
    city: "Braga",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-municipal-de-braga",
    founded: 1921,
    clubColors: ["red", "white"],
    aliases: ["sc braga"],
  },

  gilVicente: {
    teamKey: "gil-vicente",
    name: "Gil Vicente",
    country: PORTUGAL,
    city: "Barcelos",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-cidade-de-barcelos",
    founded: 1924,
    clubColors: ["red", "blue"],
    aliases: ["gil vicente"],
  },

  famalicao: {
    teamKey: "famalicao",
    name: "Famalicão",
    country: PORTUGAL,
    city: "Vila Nova de Famalicão",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-22-de-junho",
    founded: 1931,
    clubColors: ["blue", "white"],
  },

  moreirense: {
    teamKey: "moreirense",
    name: "Moreirense",
    country: PORTUGAL,
    city: "Moreira de Cónegos",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "parque-almeida-freitas",
    founded: 1938,
    clubColors: ["green", "white"],
  },

  estoril: {
    teamKey: "estoril",
    name: "Estoril Praia",
    country: PORTUGAL,
    city: "Estoril",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "antonio-coimbra-da-mota",
    founded: 1939,
    clubColors: ["yellow", "blue"],
  },

  vitoriaSC: {
    teamKey: "vitoria-sc",
    name: "Vitória SC",
    country: PORTUGAL,
    city: "Guimarães",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "dom-afonso-henriques",
    founded: 1922,
    clubColors: ["white", "black"],
  },

  alverca: {
    teamKey: "alverca",
    name: "Alverca",
    country: PORTUGAL,
    city: "Alverca do Ribatejo",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "complexo-desportivo-alverca",
    founded: 1939,
    clubColors: ["red", "white"],
  },

  arouca: {
    teamKey: "arouca",
    name: "Arouca",
    country: PORTUGAL,
    city: "Arouca",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-municipal-arouca",
    founded: 1951,
    clubColors: ["yellow", "blue"],
  },

  estrela: {
    teamKey: "estrela-amadora",
    name: "Estrela Amadora",
    country: PORTUGAL,
    city: "Amadora",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-jose-gomes",
    founded: 1932,
    clubColors: ["red", "white", "green"],
  },

  casaPia: {
    teamKey: "casa-pia",
    name: "Casa Pia",
    country: PORTUGAL,
    city: "Lisbon",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-pina-manique",
    founded: 1920,
    clubColors: ["black", "white"],
  },

  nacional: {
    teamKey: "nacional",
    name: "Nacional",
    country: PORTUGAL,
    city: "Funchal",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-da-madeira",
    founded: 1910,
    clubColors: ["black", "white"],
  },

  santaClara: {
    teamKey: "santa-clara",
    name: "Santa Clara",
    country: PORTUGAL,
    city: "Ponta Delgada",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-sao-miguel",
    founded: 1927,
    clubColors: ["red", "white"],
  },

  rioAve: {
    teamKey: "rio-ave",
    name: "Rio Ave",
    country: PORTUGAL,
    city: "Vila do Conde",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-dos-arcos",
    founded: 1939,
    clubColors: ["green", "white"],
  },

  tondela: {
    teamKey: "tondela",
    name: "Tondela",
    country: PORTUGAL,
    city: "Tondela",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-joao-cardoso",
    founded: 1933,
    clubColors: ["green", "yellow"],
  },

  avs: {
    teamKey: "avs",
    name: "AVS Futebol SAD",
    country: PORTUGAL,
    city: "Vila das Aves",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-cd-aves",
    founded: 2023,
    clubColors: ["red", "white"],
  },

};

export default primeiraLigaTeams;
