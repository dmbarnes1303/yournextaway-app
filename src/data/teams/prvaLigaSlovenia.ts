import type { TeamRecord } from "./types";

const SLOVENIA = "Slovenia";
const PRVA_LIGA = 213;

export const prvaLigaSloveniaTeams: Record<string, TeamRecord> = {
  "celje": {
    teamKey: "celje",
    name: "NK Celje",
    country: SLOVENIA,
    city: "Celje",
    leagueId: PRVA_LIGA,
    stadiumKey: "stadion-zdezele",
    aliases: ["celje", "nk celje"],
  },

  "maribor": {
    teamKey: "maribor",
    name: "NK Maribor",
    country: SLOVENIA,
    city: "Maribor",
    leagueId: PRVA_LIGA,
    stadiumKey: "ljudski-vrt",
    aliases: ["maribor", "nk maribor"],
  },

  "koper": {
    teamKey: "koper",
    name: "FC Koper",
    country: SLOVENIA,
    city: "Koper",
    leagueId: PRVA_LIGA,
    stadiumKey: "bonifika",
    aliases: ["koper", "fc koper"],
  },

  "olimpija-ljubljana": {
    teamKey: "olimpija-ljubljana",
    name: "NK Olimpija Ljubljana",
    country: SLOVENIA,
    city: "Ljubljana",
    leagueId: PRVA_LIGA,
    stadiumKey: "stozice-stadium",
    aliases: ["olimpija", "olimpija ljubljana"],
  },

  "bravo": {
    teamKey: "bravo",
    name: "NK Bravo",
    country: SLOVENIA,
    city: "Ljubljana",
    leagueId: PRVA_LIGA,
    stadiumKey: "stozice-stadium",
    aliases: ["bravo", "nk bravo"],
  },

  "radomlje": {
    teamKey: "radomlje",
    name: "NK Radomlje",
    country: SLOVENIA,
    city: "Radomlje",
    leagueId: PRVA_LIGA,
    stadiumKey: "sportni-park-radomlje",
    aliases: ["radomlje", "nk radomlje"],
  },

  "aluminij": {
    teamKey: "aluminij",
    name: "NK Aluminij",
    country: SLOVENIA,
    city: "Kidričevo",
    leagueId: PRVA_LIGA,
    stadiumKey: "sportni-park-aluminij",
    aliases: ["aluminij", "nk aluminij"],
  },

  "mura": {
    teamKey: "mura",
    name: "NS Mura",
    country: SLOVENIA,
    city: "Murska Sobota",
    leagueId: PRVA_LIGA,
    stadiumKey: "fazanerija",
    aliases: ["mura", "ns mura"],
  },

  "primorje": {
    teamKey: "primorje",
    name: "NK Primorje",
    country: SLOVENIA,
    city: "Ajdovščina",
    leagueId: PRVA_LIGA,
    stadiumKey: "mestni-stadion-ajdovscina",
    aliases: ["primorje", "nk primorje"],
  },

  "domzale": {
    teamKey: "domzale",
    name: "NK Domžale",
    country: SLOVENIA,
    city: "Domžale",
    leagueId: PRVA_LIGA,
    stadiumKey: "sportni-park-domzale",
    aliases: ["domzale", "nk domzale"],
  },
};

export default prvaLigaSloveniaTeams;
