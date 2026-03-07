// src/data/teams/allsvenskan.ts
import type { TeamRecord } from "./types";

const ALLSVENSKAN = 113;
const SWEDEN = "Sweden";

export const allsvenskanTeams: Record<string, TeamRecord> = {
  "aik": {
    teamKey: "aik",
    name: "AIK",
    country: SWEDEN,
    city: "Stockholm",
    leagueId: ALLSVENSKAN,
    aliases: ["aik stockholm"],
  },

  "degersfors": {
    teamKey: "degersfors",
    name: "Degerfors",
    country: SWEDEN,
    city: "Degerfors",
    leagueId: ALLSVENSKAN,
    aliases: ["degersfors if"],
  },

  "djurgarden": {
    teamKey: "djurgarden",
    name: "Djurgården",
    country: SWEDEN,
    city: "Stockholm",
    leagueId: ALLSVENSKAN,
    aliases: ["djurgarden", "djurgardens if", "dif"],
  },

  "elfsborg": {
    teamKey: "elfsborg",
    name: "IF Elfsborg",
    country: SWEDEN,
    city: "Borås",
    leagueId: ALLSVENSKAN,
    aliases: ["elfsborg", "if elfsborg"],
  },

  "gais": {
    teamKey: "gais",
    name: "GAIS",
    country: SWEDEN,
    city: "Gothenburg",
    leagueId: ALLSVENSKAN,
    aliases: ["gais gothenburg"],
  },

  "goteborg": {
    teamKey: "goteborg",
    name: "IFK Göteborg",
    country: SWEDEN,
    city: "Gothenburg",
    leagueId: ALLSVENSKAN,
    aliases: ["goteborg", "ifk goteborg", "göteborg"],
  },

  "hacken": {
    teamKey: "hacken",
    name: "Häcken",
    country: SWEDEN,
    city: "Gothenburg",
    leagueId: ALLSVENSKAN,
    aliases: ["hacken", "bk hacken", "häcken"],
  },

  "halmstad": {
    teamKey: "halmstad",
    name: "Halmstad",
    country: SWEDEN,
    city: "Halmstad",
    leagueId: ALLSVENSKAN,
    aliases: ["halmstads bk", "halmstad bk"],
  },

  "hammarby": {
    teamKey: "hammarby",
    name: "Hammarby",
    country: SWEDEN,
    city: "Stockholm",
    leagueId: ALLSVENSKAN,
    aliases: ["hammarby if"],
  },

  "kalmar": {
    teamKey: "kalmar",
    name: "Kalmar FF",
    country: SWEDEN,
    city: "Kalmar",
    leagueId: ALLSVENSKAN,
    aliases: ["kalmar", "kalmar ff"],
  },

  "malmo": {
    teamKey: "malmo",
    name: "Malmö",
    country: SWEDEN,
    city: "Malmö",
    leagueId: ALLSVENSKAN,
    aliases: ["malmo", "malmo ff", "malmö ff"],
  },

  "mjalby": {
    teamKey: "mjalby",
    name: "Mjällby",
    country: SWEDEN,
    city: "Hällevik",
    leagueId: ALLSVENSKAN,
    aliases: ["mjalby", "mjallby", "mjalby aif", "mjallby aif"],
  },

  "ois": {
    teamKey: "ois",
    name: "ÖIS",
    country: SWEDEN,
    city: "Gothenburg",
    leagueId: ALLSVENSKAN,
    aliases: ["ois goteborg", "öis", "orgryte", "örgryte", "orgryte is", "örgryte is"],
  },

  "sirius": {
    teamKey: "sirius",
    name: "Sirius",
    country: SWEDEN,
    city: "Uppsala",
    leagueId: ALLSVENSKAN,
    aliases: ["ik sirius", "sirius uppsala"],
  },

  "vasteras": {
    teamKey: "vasteras",
    name: "Västerås",
    country: SWEDEN,
    city: "Västerås",
    leagueId: ALLSVENSKAN,
    aliases: ["vasteras", "vasteras sk", "västerås", "västerås sk"],
  },

  "brommapojkarna": {
    teamKey: "brommapojkarna",
    name: "IF Brommapojkarna",
    country: SWEDEN,
    city: "Stockholm",
    leagueId: ALLSVENSKAN,
    aliases: ["brommapojkarna", "if brommapojkarna", "bp"],
  },
};

export default allsvenskanTeams;
