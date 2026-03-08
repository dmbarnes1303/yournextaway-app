import type { TeamRecord } from "./types";

const SLOVAKIA = "Slovakia";
const SUPER_LIGA = 332;

export const superLigaSlovakiaTeams: Record<string, TeamRecord> = {
  "slovan-bratislava": {
    teamKey: "slovan-bratislava",
    name: "Slovan Bratislava",
    city: "Bratislava",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "tehelne-pole",
    aliases: ["sk slovan bratislava", "slovan", "slovan bratislava"],
  },

  "dunajska-streda": {
    teamKey: "dunajska-streda",
    name: "DAC Dunajská Streda",
    city: "Dunajská Streda",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "mol-arena",
    aliases: ["dac", "dac 1904", "dac dunajska streda", "dunajska streda"],
  },

  "zilina": {
    teamKey: "zilina",
    name: "MŠK Žilina",
    city: "Žilina",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "stadion-pod-dubnom",
    aliases: ["zilina", "msk zilina"],
  },

  "spartak-trnava": {
    teamKey: "spartak-trnava",
    name: "Spartak Trnava",
    city: "Trnava",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "anton-malatinseho-stadium",
    aliases: ["fc spartak trnava", "spartak", "spartak trnava"],
  },

  "podbrezova": {
    teamKey: "podbrezova",
    name: "FK Železiarne Podbrezová",
    city: "Podbrezová",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "zelpo-arena",
    aliases: ["podbrezova", "fk zeleziarne podbrezova"],
  },

  "michalovce": {
    teamKey: "michalovce",
    name: "MFK Zemplín Michalovce",
    city: "Michalovce",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "mestsky-futbalovy-stadion-michalovce",
    aliases: ["michalovce", "zemplin michalovce", "mfk zemplin michalovce"],
  },

  "fc-kosice": {
    teamKey: "fc-kosice",
    name: "FC Košice",
    city: "Košice",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "kosicka-futbalova-arena",
    aliases: ["kosice", "fc kosice"],
  },

  "komarno": {
    teamKey: "komarno",
    name: "KFC Komárno",
    city: "Komárno",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "vion-arena",
    aliases: ["komarno", "kfc komarno"],
  },

  "ruzomberok": {
    teamKey: "ruzomberok",
    name: "MFK Ružomberok",
    city: "Ružomberok",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "stadion-mfk-ruzomberok",
    aliases: ["ruzomberok", "mfk ruzomberok"],
  },

  "trencin": {
    teamKey: "trencin",
    name: "AS Trenčín",
    city: "Trenčín",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "sihoť-stadium",
    aliases: ["trencin", "as trencin"],
  },

  "tatran-presov": {
    teamKey: "tatran-presov",
    name: "Tatran Prešov",
    city: "Prešov",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "futbal-tatran-arena",
    aliases: ["presov", "tatran presov", "1 fc tatran presov"],
  },

  "skalica": {
    teamKey: "skalica",
    name: "MFK Skalica",
    city: "Skalica",
    country: SLOVAKIA,
    leagueId: SUPER_LIGA,
    stadiumKey: "mestsky-stadion-skalica",
    aliases: ["skalica", "mfk skalica"],
  },
};

export default superLigaSlovakiaTeams;
