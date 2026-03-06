import type { TeamRecord } from "./types";

const LIGUE_1 = 61;
const FRANCE = "France";

export const ligue1Teams: Record<string, TeamRecord> = {
  "angers": {
    teamKey: "angers",
    name: "Angers",
    country: FRANCE,
    city: "Angers",
    leagueId: LIGUE_1,
    stadiumKey: "raymond-kopa",
    founded: 1919,
    clubColors: ["black", "white"],
    aliases: ["angers sco", "sco angers"],
  },

  "as-monaco": {
    teamKey: "as-monaco",
    name: "AS Monaco",
    country: FRANCE,
    city: "Monaco",
    leagueId: LIGUE_1,
    stadiumKey: "stade-louis-ii",
    founded: 1924,
    clubColors: ["red", "white"],
    aliases: ["monaco", "as monaco fc"],
  },

  "auxerre": {
    teamKey: "auxerre",
    name: "Auxerre",
    country: FRANCE,
    city: "Auxerre",
    leagueId: LIGUE_1,
    stadiumKey: "stade-abbe-deschamps",
    founded: 1905,
    clubColors: ["blue", "white"],
    aliases: ["aj auxerre", "aja"],
  },

  "brest": {
    teamKey: "brest",
    name: "Brest",
    country: FRANCE,
    city: "Brest",
    leagueId: LIGUE_1,
    stadiumKey: "francis-le-ble",
    founded: 1950,
    clubColors: ["red", "white"],
    aliases: ["stade brestois", "stade brestois 29"],
  },

  "le-havre": {
    teamKey: "le-havre",
    name: "Le Havre",
    country: FRANCE,
    city: "Le Havre",
    leagueId: LIGUE_1,
    stadiumKey: "stade-oceane",
    founded: 1872,
    clubColors: ["sky blue", "navy"],
    aliases: ["le havre ac", "hac"],
  },

  "lens": {
    teamKey: "lens",
    name: "Lens",
    country: FRANCE,
    city: "Lens",
    leagueId: LIGUE_1,
    stadiumKey: "bollaert-delelis",
    founded: 1906,
    clubColors: ["red", "yellow"],
    aliases: ["rc lens", "rcl"],
  },

  "lille": {
    teamKey: "lille",
    name: "Lille",
    country: FRANCE,
    city: "Lille",
    leagueId: LIGUE_1,
    stadiumKey: "pierre-mauroy",
    founded: 1944,
    clubColors: ["red", "white"],
    aliases: ["losc", "lille osc"],
  },

  "lorient": {
    teamKey: "lorient",
    name: "Lorient",
    country: FRANCE,
    city: "Lorient",
    leagueId: LIGUE_1,
    stadiumKey: "moustoir",
    founded: 1926,
    clubColors: ["orange", "black"],
    aliases: ["fc lorient"],
  },

  "lyon": {
    teamKey: "lyon",
    name: "Lyon",
    country: FRANCE,
    city: "Lyon",
    leagueId: LIGUE_1,
    stadiumKey: "groupama-stadium",
    founded: 1950,
    clubColors: ["white", "red", "blue"],
    aliases: ["ol", "olympique lyonnais"],
  },

  "marseille": {
    teamKey: "marseille",
    name: "Marseille",
    country: FRANCE,
    city: "Marseille",
    leagueId: LIGUE_1,
    stadiumKey: "velodrome",
    founded: 1899,
    clubColors: ["white", "sky blue"],
    aliases: ["om", "olympique de marseille"],
  },

  "metz": {
    teamKey: "metz",
    name: "Metz",
    country: FRANCE,
    city: "Metz",
    leagueId: LIGUE_1,
    stadiumKey: "saint-symphorien",
    founded: 1932,
    clubColors: ["maroon"],
    aliases: ["fc metz"],
  },

  "nantes": {
    teamKey: "nantes",
    name: "Nantes",
    country: FRANCE,
    city: "Nantes",
    leagueId: LIGUE_1,
    stadiumKey: "la-beaujoire",
    founded: 1943,
    clubColors: ["yellow", "green"],
    aliases: ["fc nantes"],
  },

  "nice": {
    teamKey: "nice",
    name: "Nice",
    country: FRANCE,
    city: "Nice",
    leagueId: LIGUE_1,
    stadiumKey: "allianz-riviera",
    founded: 1904,
    clubColors: ["red", "black"],
    aliases: ["ogc nice"],
  },

  "paris-fc": {
    teamKey: "paris-fc",
    name: "Paris FC",
    country: FRANCE,
    city: "Paris",
    leagueId: LIGUE_1,
    stadiumKey: "charlety",
    founded: 1969,
    clubColors: ["blue"],
    aliases: ["paris fc"],
  },

  "paris-saint-germain": {
    teamKey: "paris-saint-germain",
    name: "Paris Saint-Germain",
    country: FRANCE,
    city: "Paris",
    leagueId: LIGUE_1,
    stadiumKey: "parc-des-princes",
    founded: 1970,
    clubColors: ["blue", "red", "white"],
    aliases: ["psg", "paris sg", "paris st germain"],
  },

  "rennes": {
    teamKey: "rennes",
    name: "Rennes",
    country: FRANCE,
    city: "Rennes",
    leagueId: LIGUE_1,
    stadiumKey: "roazhon-park",
    founded: 1901,
    clubColors: ["red", "black"],
    aliases: ["stade rennais", "stade rennais fc"],
  },

  "strasbourg": {
    teamKey: "strasbourg",
    name: "Strasbourg",
    country: FRANCE,
    city: "Strasbourg",
    leagueId: LIGUE_1,
    stadiumKey: "meinau",
    founded: 1906,
    clubColors: ["blue", "white"],
    aliases: ["rc strasbourg", "racing"],
  },

  "toulouse": {
    teamKey: "toulouse",
    name: "Toulouse",
    country: FRANCE,
    city: "Toulouse",
    leagueId: LIGUE_1,
    stadiumKey: "municipal-toulouse",
    founded: 1970,
    clubColors: ["purple"],
    aliases: ["tfc", "toulouse fc"],
  },
};

export default ligue1Teams;
