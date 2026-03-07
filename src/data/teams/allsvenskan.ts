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
    stadiumKey: "strawberry-arena",
    aliases: ["aik stockholm"],
  },

  "degersfors": {
    teamKey: "degersfors",
    name: "Degerfors",
    country: SWEDEN,
    city: "Degerfors",
    leagueId: ALLSVENSKAN,
    stadiumKey: "stora-valla",
    aliases: ["degersfors if"],
  },

  "djurgarden": {
    teamKey: "djurgarden",
    name: "Djurgården",
    country: SWEDEN,
    city: "Stockholm",
    leagueId: ALLSVENSKAN,
    stadiumKey: "3arena",
    aliases: ["djurgarden", "djurgardens if", "dif"],
  },

  "elfsborg": {
    teamKey: "elfsborg",
    name: "IF Elfsborg",
    country: SWEDEN,
    city: "Borås",
    leagueId: ALLSVENSKAN,
    stadiumKey: "boras-arena",
    aliases: ["elfsborg", "if elfsborg"],
  },

  "gais": {
    teamKey: "gais",
    name: "GAIS",
    country: SWEDEN,
    city: "Gothenburg",
    leagueId: ALLSVENSKAN,
    stadiumKey: "gamla-ullevi",
    aliases: ["gais gothenburg"],
  },

  "goteborg": {
    teamKey: "goteborg",
    name: "IFK Göteborg",
    country: SWEDEN,
    city: "Gothenburg",
    leagueId: ALLSVENSKAN,
    stadiumKey: "gamla-ullevi",
    aliases: ["goteborg", "ifk goteborg", "göteborg"],
  },

  "hacken": {
    teamKey: "hacken",
    name: "Häcken",
    country: SWEDEN,
    city: "Gothenburg",
    leagueId: ALLSVENSKAN,
    stadiumKey: "nordic-wellness-arena",
    aliases: ["hacken", "bk hacken", "häcken"],
  },

  "halmstad": {
    teamKey: "halmstad",
    name: "Halmstad",
    country: SWEDEN,
    city: "Halmstad",
    leagueId: ALLSVENSKAN,
    stadiumKey: "orjans-vall",
    aliases: ["halmstads bk", "halmstad bk"],
  },

  "hammarby": {
    teamKey: "hammarby",
    name: "Hammarby",
    country: SWEDEN,
    city: "Stockholm",
    leagueId: ALLSVENSKAN,
    stadiumKey: "3arena",
    aliases: ["hammarby if"],
  },

  "kalmar": {
    teamKey: "kalmar",
    name: "Kalmar FF",
    country: SWEDEN,
    city: "Kalmar",
    leagueId: ALLSVENSKAN,
    stadiumKey: "guldfageln-arena",
    aliases: ["kalmar", "kalmar ff"],
  },

  "malmo": {
    teamKey: "malmo",
    name: "Malmö",
    country: SWEDEN,
    city: "Malmö",
    leagueId: ALLSVENSKAN,
    stadiumKey: "eleda-stadion",
    aliases: ["malmo", "malmo ff", "malmö ff"],
  },

  "mjalby": {
    teamKey: "mjalby",
    name: "Mjällby",
    country: SWEDEN,
    city: "Hällevik",
    leagueId: ALLSVENSKAN,
    stadiumKey: "strandvallen",
    aliases: ["mjalby", "mjallby", "mjalby aif", "mjallby aif"],
  },

  "ois": {
    teamKey: "ois",
    name: "ÖIS",
    country: SWEDEN,
    city: "Gothenburg",
    leagueId: ALLSVENSKAN,
    stadiumKey: "gamla-ullevi",
    aliases: ["ois goteborg", "öis", "orgryte", "örgryte", "orgryte is", "örgryte is"],
  },

  "sirius": {
    teamKey: "sirius",
    name: "Sirius",
    country: SWEDEN,
    city: "Uppsala",
    leagueId: ALLSVENSKAN,
    stadiumKey: "studenternas-ip",
    aliases: ["ik sirius", "sirius uppsala"],
  },

  "vasteras": {
    teamKey: "vasteras",
    name: "Västerås",
    country: SWEDEN,
    city: "Västerås",
    leagueId: ALLSVENSKAN,
    stadiumKey: "hitachi-energy-arena",
    aliases: ["vasteras", "vasteras sk", "västerås", "västerås sk"],
  },

  "brommapojkarna": {
    teamKey: "brommapojkarna",
    name: "IF Brommapojkarna",
    country: SWEDEN,
    city: "Stockholm",
    leagueId: ALLSVENSKAN,
    stadiumKey: "grimsta-ip",
    aliases: ["brommapojkarna", "if brommapojkarna", "bp"],
  },
};

export default allsvenskanTeams;
