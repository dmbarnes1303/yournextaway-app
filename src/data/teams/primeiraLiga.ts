import type { TeamRecord } from "./types";

const PRIMEIRA_LIGA = 94;
const PORTUGAL = "Portugal";

export const primeiraLigaTeams: Record<string, TeamRecord> = {
  "benfica": {
    teamKey: "benfica",
    name: "Benfica",
    country: PORTUGAL,
    city: "Lisbon",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-da-luz",
    founded: 1904,
    clubColors: ["red", "white"],
    aliases: ["sl benfica", "benfica lisbon"],
  },

  "porto": {
    teamKey: "porto",
    name: "FC Porto",
    country: PORTUGAL,
    city: "Porto",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-do-dragao",
    founded: 1893,
    clubColors: ["blue", "white"],
    aliases: ["porto", "fc porto"],
  },

  "sporting-cp": {
    teamKey: "sporting-cp",
    name: "Sporting CP",
    country: PORTUGAL,
    city: "Lisbon",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-jose-alvalade",
    founded: 1906,
    clubColors: ["green", "white"],
    aliases: ["sporting", "sporting lisbon", "sporting clube de portugal"],
  },

  "braga": {
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

  "vitoria-guimaraes": {
    teamKey: "vitoria-guimaraes",
    name: "Vitória Guimarães",
    country: PORTUGAL,
    city: "Guimarães",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-dom-afonso-henriques",
    founded: 1922,
    clubColors: ["white", "black"],
    aliases: ["vitoria", "guimaraes", "vitoria sc"],
  },

  "boavista": {
    teamKey: "boavista",
    name: "Boavista",
    country: PORTUGAL,
    city: "Porto",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-do-bessa",
    founded: 1903,
    clubColors: ["black", "white"],
    aliases: ["boavista fc"],
  },

  "famalicao": {
    teamKey: "famalicao",
    name: "Famalicão",
    country: PORTUGAL,
    city: "Vila Nova de Famalicão",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-municipal-22-de-junho",
    founded: 1931,
    clubColors: ["blue", "white"],
    aliases: ["fc famalicao"],
  },

  "moreirense": {
    teamKey: "moreirense",
    name: "Moreirense",
    country: PORTUGAL,
    city: "Moreira de Cónegos",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "parque-joaquim-de-almeida-freitas",
    founded: 1938,
    clubColors: ["green", "white"],
    aliases: ["moreirense fc"],
  },

  "gil-vicente": {
    teamKey: "gil-vicente",
    name: "Gil Vicente",
    country: PORTUGAL,
    city: "Barcelos",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-cidade-de-barcelos",
    founded: 1924,
    clubColors: ["red", "blue"],
    aliases: ["gil vicente fc"],
  },

  "rio-ave": {
    teamKey: "rio-ave",
    name: "Rio Ave",
    country: PORTUGAL,
    city: "Vila do Conde",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-dos-arcos",
    founded: 1939,
    clubColors: ["green", "white"],
    aliases: ["rio ave fc"],
  },

  "estoril": {
    teamKey: "estoril",
    name: "Estoril",
    country: PORTUGAL,
    city: "Estoril",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-antonio-coimbra-da-mota",
    founded: 1939,
    clubColors: ["yellow", "blue"],
    aliases: ["estoril praia"],
  },

  "casa-pia": {
    teamKey: "casa-pia",
    name: "Casa Pia",
    country: PORTUGAL,
    city: "Lisbon",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-pina-manique",
    founded: 1920,
    clubColors: ["black", "white"],
    aliases: ["casa pia ac"],
  },

  "arouca": {
    teamKey: "arouca",
    name: "Arouca",
    country: PORTUGAL,
    city: "Arouca",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-municipal-de-arouca",
    founded: 1951,
    clubColors: ["yellow", "blue"],
    aliases: ["fc arouca"],
  },

  "farense": {
    teamKey: "farense",
    name: "Farense",
    country: PORTUGAL,
    city: "Faro",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-de-sao-luis",
    founded: 1910,
    clubColors: ["black", "white"],
    aliases: ["sc farense"],
  },

  "nacional": {
    teamKey: "nacional",
    name: "Nacional",
    country: PORTUGAL,
    city: "Funchal",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-da-madeira",
    founded: 1910,
    clubColors: ["black", "white"],
    aliases: ["cd nacional"],
  },

  "santa-clara": {
    teamKey: "santa-clara",
    name: "Santa Clara",
    country: PORTUGAL,
    city: "Ponta Delgada",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-de-sao-miguel",
    founded: 1927,
    clubColors: ["red", "white"],
    aliases: ["cd santa clara"],
  },

  "estrela-amadora": {
    teamKey: "estrela-amadora",
    name: "Estrela Amadora",
    country: PORTUGAL,
    city: "Amadora",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-jose-gomes",
    founded: 1932,
    clubColors: ["red", "white", "green"],
    aliases: ["estrela da amadora"],
  },

  "avs": {
    teamKey: "avs",
    name: "AVS",
    country: PORTUGAL,
    city: "Vila das Aves",
    leagueId: PRIMEIRA_LIGA,
    stadiumKey: "estadio-do-cd-aves",
    founded: 2023,
    clubColors: ["red", "white"],
    aliases: ["avs futebol sad"],
  },
};

export default primeiraLigaTeams;
