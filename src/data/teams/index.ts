// src/data/teams/index.ts
import { LEAGUES, type LeagueOption } from "@/src/constants/football";

/**
 * V1 Team Registry (single source of truth)
 *
 * Why this exists:
 * - Home search must be able to find teams even when fixtures API results don't include them yet.
 * - Team guides will be keyed by a stable `teamKey`.
 *
 * Notes:
 * - Keep this registry accurate and deterministic.
 * - Bundesliga and Ligue 1 are 18-team leagues (do NOT force 20).
 * - Avoid hardcoding season per team unless absolutely necessary; prefer LEAGUES season.
 * - Add aliases for common user inputs + API-Football variants (diacritics, prefixes, punctuation).
 */

export type TeamRecord = {
  /** Stable key used in routes and teamGuides lookups (e.g. "arsenal", "real-madrid") */
  teamKey: string;

  /** API-Football team id (number) if you have it; optional in V1 */
  teamId?: number;

  /** Display name */
  name: string;

  /** Country (for search + UX) */
  country?: string;

  /** City (optional, useful for trip context) */
  city?: string;

  /** Primary league this team belongs to in your app (leagueId from LEAGUES) */
  leagueId?: number;

  /** Season context (defaults to matching league season) */
  season?: number;

  /** Search aliases: abbreviations, nicknames, alternate spellings */
  aliases?: string[];
};

// League IDs (API-Football conventional IDs used throughout the project)
const EPL = 39;
const LALIGA = 140;
const SERIE_A = 135;
const BUNDESLIGA = 78;
const LIGUE_1 = 61;

const ENGLAND = "England";
const SPAIN = "Spain";
const ITALY = "Italy";
const GERMANY = "Germany";
const FRANCE = "France";

/**
 * Remove diacritics safely (Köln -> Koln, München -> Munchen).
 * This is critical for matching API/fixture names to registry keys.
 */
function stripDiacritics(input: string): string {
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return input;
  }
}

/**
 * Normalise any user input or label into a comparable key.
 * Deterministic and diacritics-safe.
 */
export function normalizeTeamKey(input: string): string {
  const s = stripDiacritics(String(input ?? ""))
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "");

  return s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Registry keyed by teamKey.
 *
 * Gold standard:
 * - Alphabetical by teamKey (ideal, not required for correctness)
 * - Minimal but useful aliases
 * - leagueId set for routing + filtering
 */
export const teams: Record<string, TeamRecord> = {
  // -------------------------
  // Premier League (20 teams)
  // -------------------------
  "afc-bournemouth": {
    teamKey: "afc-bournemouth",
    name: "AFC Bournemouth",
    country: ENGLAND,
    city: "Bournemouth",
    leagueId: EPL,
    aliases: ["bournemouth", "bournemouth afc", "the cherries", "cherries"],
  },

  "arsenal": {
    teamKey: "arsenal",
    name: "Arsenal",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["arsenal fc", "gunners", "the gunners"],
  },

  "aston-villa": {
    teamKey: "aston-villa",
    name: "Aston Villa",
    country: ENGLAND,
    city: "Birmingham",
    leagueId: EPL,
    aliases: ["villa", "aston villa fc"],
  },

  "brentford": {
    teamKey: "brentford",
    name: "Brentford",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["brentford fc", "the bees", "bees"],
  },

  "brighton-hove-albion": {
    teamKey: "brighton-hove-albion",
    name: "Brighton & Hove Albion",
    country: ENGLAND,
    city: "Brighton",
    leagueId: EPL,
    aliases: [
      "brighton",
      "brighton and hove albion",
      "brighton hove albion",
      "bhafc",
      "seagulls",
      "the seagulls",
    ],
  },

  "burnley": {
    teamKey: "burnley",
    name: "Burnley",
    country: ENGLAND,
    city: "Burnley",
    leagueId: EPL,
    aliases: ["burnley fc", "clarets", "the clarets"],
  },

  "chelsea": {
    teamKey: "chelsea",
    name: "Chelsea",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["chelsea fc", "the blues", "blues"],
  },

  "crystal-palace": {
    teamKey: "crystal-palace",
    name: "Crystal Palace",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["palace", "crystal palace fc", "eagles", "the eagles"],
  },

  "everton": {
    teamKey: "everton",
    name: "Everton",
    country: ENGLAND,
    city: "Liverpool",
    leagueId: EPL,
    aliases: ["everton fc", "the toffees", "toffees"],
  },

  "fulham": {
    teamKey: "fulham",
    name: "Fulham",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["fulham fc", "the cottagers", "cottagers"],
  },

  "leeds-united": {
    teamKey: "leeds-united",
    name: "Leeds United",
    country: ENGLAND,
    city: "Leeds",
    leagueId: EPL,
    aliases: ["leeds", "leeds utd", "leeds united fc", "lufc"],
  },

  "liverpool": {
    teamKey: "liverpool",
    name: "Liverpool",
    country: ENGLAND,
    city: "Liverpool",
    leagueId: EPL,
    aliases: ["liverpool fc", "lfc", "the reds", "reds"],
  },

  "manchester-city": {
    teamKey: "manchester-city",
    name: "Manchester City",
    country: ENGLAND,
    city: "Manchester",
    leagueId: EPL,
    aliases: ["man city", "manchester city fc", "mcfc", "city"],
  },

  "manchester-united": {
    teamKey: "manchester-united",
    name: "Manchester United",
    country: ENGLAND,
    city: "Manchester",
    leagueId: EPL,
    aliases: ["man utd", "man united", "manchester united fc", "mufc", "utd"],
  },

  "newcastle-united": {
    teamKey: "newcastle-united",
    name: "Newcastle United",
    country: ENGLAND,
    city: "Newcastle upon Tyne",
    leagueId: EPL,
    aliases: ["newcastle", "newcastle utd", "nufc", "toon", "the toon"],
  },

  "nottingham-forest": {
    teamKey: "nottingham-forest",
    name: "Nottingham Forest",
    country: ENGLAND,
    city: "Nottingham",
    leagueId: EPL,
    aliases: ["forest", "notts forest", "nottingham forest fc", "nffc"],
  },

  "sunderland": {
    teamKey: "sunderland",
    name: "Sunderland",
    country: ENGLAND,
    city: "Sunderland",
    leagueId: EPL,
    aliases: ["sunderland afc", "safc", "black cats", "the black cats"],
  },

  "tottenham-hotspur": {
    teamKey: "tottenham-hotspur",
    name: "Tottenham Hotspur",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["spurs", "tottenham", "tottenham hotspur fc", "thfc"],
  },

  "west-ham-united": {
    teamKey: "west-ham-united",
    name: "West Ham United",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["west ham", "whu", "whufc", "hammers", "the hammers"],
  },

  "wolves": {
    teamKey: "wolves",
    name: "Wolverhampton Wanderers",
    country: ENGLAND,
    city: "Wolverhampton",
    leagueId: EPL,
    aliases: ["wolverhampton", "wolverhampton wanderers", "wolves fc", "wwfc"],
  },

  // -------------------------
  // La Liga (20 teams)
  // -------------------------
  "athletic-club": {
    teamKey: "athletic-club",
    name: "Athletic Club",
    country: SPAIN,
    city: "Bilbao",
    leagueId: LALIGA,
    aliases: ["athletic", "athletic bilbao", "bilbao"],
  },

  "atletico-madrid": {
    teamKey: "atletico-madrid",
    name: "Atlético Madrid",
    country: SPAIN,
    city: "Madrid",
    leagueId: LALIGA,
    aliases: ["atletico", "atleti", "atletico madrid"],
  },

  "barcelona": {
    teamKey: "barcelona",
    name: "Barcelona",
    country: SPAIN,
    city: "Barcelona",
    leagueId: LALIGA,
    aliases: ["barca", "fc barcelona"],
  },

  "celta-vigo": {
    teamKey: "celta-vigo",
    name: "Celta Vigo",
    country: SPAIN,
    city: "Vigo",
    leagueId: LALIGA,
    aliases: ["celta", "rc celta", "celta de vigo"],
  },

  "deportivo-alaves": {
    teamKey: "deportivo-alaves",
    name: "Deportivo Alavés",
    country: SPAIN,
    city: "Vitoria-Gasteiz",
    leagueId: LALIGA,
    aliases: ["alaves", "alavés", "deportivo alaves"],
  },

  "elche": {
    teamKey: "elche",
    name: "Elche",
    country: SPAIN,
    city: "Elche",
    leagueId: LALIGA,
    aliases: ["elche cf"],
  },

  "espanyol": {
    teamKey: "espanyol",
    name: "Espanyol",
    country: SPAIN,
    city: "Barcelona",
    leagueId: LALIGA,
    aliases: ["rcd espanyol", "espanyol barcelona"],
  },

  "getafe": {
    teamKey: "getafe",
    name: "Getafe",
    country: SPAIN,
    city: "Getafe",
    leagueId: LALIGA,
    aliases: ["getafe cf"],
  },

  "girona": {
    teamKey: "girona",
    name: "Girona",
    country: SPAIN,
    city: "Girona",
    leagueId: LALIGA,
    aliases: ["girona fc"],
  },

  "levante": {
    teamKey: "levante",
    name: "Levante",
    country: SPAIN,
    city: "Valencia",
    leagueId: LALIGA,
    aliases: ["levante ud"],
  },

  "mallorca": {
    teamKey: "mallorca",
    name: "Mallorca",
    country: SPAIN,
    city: "Palma",
    leagueId: LALIGA,
    aliases: ["rcd mallorca"],
  },

  "osasuna": {
    teamKey: "osasuna",
    name: "Osasuna",
    country: SPAIN,
    city: "Pamplona",
    leagueId: LALIGA,
    aliases: ["ca osasuna"],
  },

  "rayo-vallecano": {
    teamKey: "rayo-vallecano",
    name: "Rayo Vallecano",
    country: SPAIN,
    city: "Madrid",
    leagueId: LALIGA,
    aliases: ["rayo", "rayo vallecano"],
  },

  "real-betis": {
    teamKey: "real-betis",
    name: "Real Betis",
    country: SPAIN,
    city: "Seville",
    leagueId: LALIGA,
    aliases: ["betis", "real betis balompie"],
  },

  "real-madrid": {
    teamKey: "real-madrid",
    name: "Real Madrid",
    country: SPAIN,
    city: "Madrid",
    leagueId: LALIGA,
    aliases: ["madrid", "rm", "real madrid cf"],
  },

  "real-oviedo": {
    teamKey: "real-oviedo",
    name: "Real Oviedo",
    country: SPAIN,
    city: "Oviedo",
    leagueId: LALIGA,
    aliases: ["oviedo"],
  },

  "real-sociedad": {
    teamKey: "real-sociedad",
    name: "Real Sociedad",
    country: SPAIN,
    city: "San Sebastián",
    leagueId: LALIGA,
    aliases: ["sociedad", "la real"],
  },

  "sevilla": {
    teamKey: "sevilla",
    name: "Sevilla",
    country: SPAIN,
    city: "Seville",
    leagueId: LALIGA,
    aliases: ["sevilla fc"],
  },

  "valencia": {
    teamKey: "valencia",
    name: "Valencia",
    country: SPAIN,
    city: "Valencia",
    leagueId: LALIGA,
    aliases: ["valencia cf"],
  },

  "villarreal": {
    teamKey: "villarreal",
    name: "Villarreal",
    country: SPAIN,
    city: "Villarreal",
    leagueId: LALIGA,
    aliases: ["villarreal cf", "yellow submarine"],
  },

  // -------------------------
  // Serie A (20 teams)
  // -------------------------
  "ac-milan": {
    teamKey: "ac-milan",
    name: "AC Milan",
    country: ITALY,
    city: "Milan",
    leagueId: SERIE_A,
    aliases: ["milan", "a.c. milan", "rossoneri"],
  },

  // ✅ ADDED (missing in your unresolved list)
  "atalanta": {
    teamKey: "atalanta",
    name: "Atalanta",
    country: ITALY,
    city: "Bergamo",
    leagueId: SERIE_A,
    aliases: ["atalanta bc", "atalanta bergamo", "dea"],
  },

  "as-roma": {
    teamKey: "as-roma",
    name: "AS Roma",
    country: ITALY,
    city: "Rome",
    leagueId: SERIE_A,
    aliases: ["roma", "a.s. roma", "giallorossi"],
  },

  "bologna": {
    teamKey: "bologna",
    name: "Bologna",
    country: ITALY,
    city: "Bologna",
    leagueId: SERIE_A,
    aliases: ["bologna fc", "rossoblu"],
  },

  "cagliari": {
    teamKey: "cagliari",
    name: "Cagliari",
    country: ITALY,
    city: "Cagliari",
    leagueId: SERIE_A,
    aliases: ["cagliari calcio"],
  },

  "como-1907": {
    teamKey: "como-1907",
    name: "Como 1907",
    country: ITALY,
    city: "Como",
    leagueId: SERIE_A,
    aliases: ["como", "como calcio"],
  },

  "cremonese": {
    teamKey: "cremonese",
    name: "Cremonese",
    country: ITALY,
    city: "Cremona",
    leagueId: SERIE_A,
    aliases: ["us cremonese", "cremo"],
  },

  "fiorentina": {
    teamKey: "fiorentina",
    name: "Fiorentina",
    country: ITALY,
    city: "Florence",
    leagueId: SERIE_A,
    aliases: ["acf fiorentina", "viola"],
  },

  "genoa": {
    teamKey: "genoa",
    name: "Genoa",
    country: ITALY,
    city: "Genoa",
    leagueId: SERIE_A,
    aliases: ["genoa cfc", "grifone"],
  },

  "hellas-verona": {
    teamKey: "hellas-verona",
    name: "Hellas Verona",
    country: ITALY,
    city: "Verona",
    leagueId: SERIE_A,
    aliases: ["verona", "hellas"],
  },

  "inter": {
    teamKey: "inter",
    name: "Inter",
    country: ITALY,
    city: "Milan",
    leagueId: SERIE_A,
    aliases: ["internazionale", "inter milan", "fc internazionale", "nerazzurri"],
  },

  "juventus": {
    teamKey: "juventus",
    name: "Juventus",
    country: ITALY,
    city: "Turin",
    leagueId: SERIE_A,
    aliases: ["juve", "juventus fc", "bianconeri"],
  },

  "lazio": {
    teamKey: "lazio",
    name: "Lazio",
    country: ITALY,
    city: "Rome",
    leagueId: SERIE_A,
    aliases: ["ss lazio"],
  },

  // ✅ FIXED: Lecce key was wrong in your file ("lecco")
  "lecce": {
    teamKey: "lecce",
    name: "Lecce",
    country: ITALY,
    city: "Lecce",
    leagueId: SERIE_A,
    aliases: ["us lecce", "u.s. lecce", "lecco"], // keep "lecco" as a safety net if any old refs exist
  },

  "napoli": {
    teamKey: "napoli",
    name: "Napoli",
    country: ITALY,
    city: "Naples",
    leagueId: SERIE_A,
    aliases: ["ssc napoli"],
  },

  "parma": {
    teamKey: "parma",
    name: "Parma",
    country: ITALY,
    city: "Parma",
    leagueId: SERIE_A,
    aliases: ["parma calcio"],
  },

  "pisa": {
    teamKey: "pisa",
    name: "Pisa",
    country: ITALY,
    city: "Pisa",
    leagueId: SERIE_A,
    aliases: ["pisa sc"],
  },

  "sassuolo": {
    teamKey: "sassuolo",
    name: "Sassuolo",
    country: ITALY,
    city: "Sassuolo",
    leagueId: SERIE_A,
    aliases: ["u.s. sassuolo", "sassuolo calcio"],
  },

  "torino": {
    teamKey: "torino",
    name: "Torino",
    country: ITALY,
    city: "Turin",
    leagueId: SERIE_A,
    aliases: ["torino fc", "il toro"],
  },

  "udinese": {
    teamKey: "udinese",
    name: "Udinese",
    country: ITALY,
    city: "Udine",
    leagueId: SERIE_A,
    aliases: ["udinese calcio"],
  },

  // -------------------------
  // Bundesliga (18 teams)
  // -------------------------
  "augsburg": {
    teamKey: "augsburg",
    name: "Augsburg",
    country: GERMANY,
    city: "Augsburg",
    leagueId: BUNDESLIGA,
    aliases: ["fc augsburg", "fca"],
  },

  "bayer-leverkusen": {
    teamKey: "bayer-leverkusen",
    name: "Bayer Leverkusen",
    country: GERMANY,
    city: "Leverkusen",
    leagueId: BUNDESLIGA,
    aliases: ["leverkusen", "b04", "die werkself"],
  },

  "bayern-munich": {
    teamKey: "bayern-munich",
    name: "Bayern Munich",
    country: GERMANY,
    city: "Munich",
    leagueId: BUNDESLIGA,
    // ✅ critical: cover API variants + diacritics
    aliases: [
      "bayern",
      "fc bayern",
      "fcb",
      "bayern munich",
      "fc bayern munich",
      "bayern munchen",
      "bayern münchen",
      "fc bayern munchen",
      "fc bayern münchen",
      "fc bayern muenchen",
      "bayern muenchen",
    ],
  },

  "borussia-dortmund": {
    teamKey: "borussia-dortmund",
    name: "Borussia Dortmund",
    country: GERMANY,
    city: "Dortmund",
    leagueId: BUNDESLIGA,
    aliases: ["dortmund", "bvb", "bvb 09"],
  },

  "borussia-mgladbach": {
    teamKey: "borussia-mgladbach",
    name: "Borussia M'gladbach",
    country: GERMANY,
    city: "Mönchengladbach",
    leagueId: BUNDESLIGA,
    aliases: ["gladbach", "bmg", "borussia monchengladbach", "borussia mönchengladbach"],
  },

  "eintracht-frankfurt": {
    teamKey: "eintracht-frankfurt",
    name: "Eintracht Frankfurt",
    country: GERMANY,
    city: "Frankfurt",
    leagueId: BUNDESLIGA,
    aliases: ["frankfurt", "sge", "eintracht"],
  },

  // ✅ critical: fixture names often come as "1. FC Köln"
  "fc-cologne": {
    teamKey: "fc-cologne",
    name: "FC Cologne",
    country: GERMANY,
    city: "Cologne",
    leagueId: BUNDESLIGA,
    aliases: [
      "koln",
      "köln",
      "cologne",
      "1 fc koln",
      "1 fc köln",
      "1. fc koln",
      "1. fc köln",
      "1-fc-koln",
      "1-fc-köln",
      "fc koln",
      "fc köln",
    ],
  },

  "fc-heidenheim": {
    teamKey: "fc-heidenheim",
    name: "FC Heidenheim",
    country: GERMANY,
    city: "Heidenheim",
    leagueId: BUNDESLIGA,
    aliases: ["heidenheim", "fch", "1. fc heidenheim"],
  },

  "freiburg": {
    teamKey: "freiburg",
    name: "Freiburg",
    country: GERMANY,
    city: "Freiburg",
    leagueId: BUNDESLIGA,
    aliases: ["sc freiburg", "scf"],
  },

  "hamburger-sv": {
    teamKey: "hamburger-sv",
    name: "Hamburger SV",
    country: GERMANY,
    city: "Hamburg",
    leagueId: BUNDESLIGA,
    aliases: ["hsv", "hamburg"],
  },

  // ✅ critical: fixture name often "1899 Hoffenheim"
  "hoffenheim": {
    teamKey: "hoffenheim",
    name: "Hoffenheim",
    country: GERMANY,
    city: "Sinsheim",
    leagueId: BUNDESLIGA,
    aliases: [
      "tsg hoffenheim",
      "tsg 1899",
      "hoffenheim 1899",
      "1899 hoffenheim",
      "tsg 1899 hoffenheim",
      "tsg-1899-hoffenheim",
    ],
  },

  "mainz-05": {
    teamKey: "mainz-05",
    name: "Mainz 05",
    country: GERMANY,
    city: "Mainz",
    leagueId: BUNDESLIGA,
    // ✅ critical: fixture names often "FSV Mainz 05"
    aliases: ["mainz", "fsv mainz", "1. fsv mainz 05", "fsv mainz 05", "1 fsv mainz 05"],
  },

  "rb-leipzig": {
    teamKey: "rb-leipzig",
    name: "RB Leipzig",
    country: GERMANY,
    city: "Leipzig",
    leagueId: BUNDESLIGA,
    aliases: ["leipzig", "rasenballsport leipzig"],
  },

  "st-pauli": {
    teamKey: "st-pauli",
    name: "St. Pauli",
    country: GERMANY,
    city: "Hamburg",
    leagueId: BUNDESLIGA,
    aliases: ["fc st pauli", "st pauli"],
  },

  "union-berlin": {
    teamKey: "union-berlin",
    name: "Union Berlin",
    country: GERMANY,
    city: "Berlin",
    leagueId: BUNDESLIGA,
    aliases: ["union", "fc union", "1. fc union berlin"],
  },

  "vfb-stuttgart": {
    teamKey: "vfb-stuttgart",
    name: "VfB Stuttgart",
    country: GERMANY,
    city: "Stuttgart",
    leagueId: BUNDESLIGA,
    aliases: ["stuttgart", "vfb"],
  },

  "werder-bremen": {
    teamKey: "werder-bremen",
    name: "Werder Bremen",
    country: GERMANY,
    city: "Bremen",
    leagueId: BUNDESLIGA,
    aliases: ["werder", "sv werder bremen"],
  },

  "wolfsburg": {
    teamKey: "wolfsburg",
    name: "Wolfsburg",
    country: GERMANY,
    city: "Wolfsburg",
    leagueId: BUNDESLIGA,
    aliases: ["vfl wolfsburg", "vfl"],
  },

  // -------------------------
  // Ligue 1 (18 teams)
  // -------------------------
  "angers": {
    teamKey: "angers",
    name: "Angers",
    country: FRANCE,
    city: "Angers",
    leagueId: LIGUE_1,
    aliases: ["angers sco", "sco angers"],
  },

  "as-monaco": {
    teamKey: "as-monaco",
    name: "AS Monaco",
    country: FRANCE,
    city: "Monaco",
    leagueId: LIGUE_1,
    aliases: ["monaco", "as monaco fc"],
  },

  "auxerre": {
    teamKey: "auxerre",
    name: "Auxerre",
    country: FRANCE,
    city: "Auxerre",
    leagueId: LIGUE_1,
    aliases: ["aj auxerre", "aja"],
  },

  "brest": {
    teamKey: "brest",
    name: "Brest",
    country: FRANCE,
    city: "Brest",
    leagueId: LIGUE_1,
    aliases: ["stade brestois", "stade brestois 29"],
  },

  "le-havre": {
    teamKey: "le-havre",
    name: "Le Havre",
    country: FRANCE,
    city: "Le Havre",
    leagueId: LIGUE_1,
    aliases: ["le havre ac", "hac"],
  },

  "lens": {
    teamKey: "lens",
    name: "Lens",
    country: FRANCE,
    city: "Lens",
    leagueId: LIGUE_1,
    aliases: ["rc lens", "rcl"],
  },

  "lille": {
    teamKey: "lille",
    name: "Lille",
    country: FRANCE,
    city: "Lille",
    leagueId: LIGUE_1,
    aliases: ["losc", "lille osc"],
  },

  "lorient": {
    teamKey: "lorient",
    name: "Lorient",
    country: FRANCE,
    city: "Lorient",
    leagueId: LIGUE_1,
    aliases: ["fc lorient"],
  },

  "lyon": {
    teamKey: "lyon",
    name: "Lyon",
    country: FRANCE,
    city: "Lyon",
    leagueId: LIGUE_1,
    aliases: ["ol", "olympique lyonnais"],
  },

  "marseille": {
    teamKey: "marseille",
    name: "Marseille",
    country: FRANCE,
    city: "Marseille",
    leagueId: LIGUE_1,
    aliases: ["om", "olympique de marseille"],
  },

  "metz": {
    teamKey: "metz",
    name: "Metz",
    country: FRANCE,
    city: "Metz",
    leagueId: LIGUE_1,
    aliases: ["fc metz"],
  },

  "nantes": {
    teamKey: "nantes",
    name: "Nantes",
    country: FRANCE,
    city: "Nantes",
    leagueId: LIGUE_1,
    aliases: ["fc nantes"],
  },

  "nice": {
    teamKey: "nice",
    name: "Nice",
    country: FRANCE,
    city: "Nice",
    leagueId: LIGUE_1,
    aliases: ["ogc nice"],
  },

  "paris-fc": {
    teamKey: "paris-fc",
    name: "Paris FC",
    country: FRANCE,
    city: "Paris",
    leagueId: LIGUE_1,
    aliases: ["paris fc"],
  },

  "paris-saint-germain": {
    teamKey: "paris-saint-germain",
    name: "Paris Saint-Germain",
    country: FRANCE,
    city: "Paris",
    leagueId: LIGUE_1,
    aliases: ["psg", "paris sg", "paris st germain"],
  },

  "rennes": {
    teamKey: "rennes",
    name: "Rennes",
    country: FRANCE,
    city: "Rennes",
    leagueId: LIGUE_1,
    aliases: ["stade rennais", "stade rennais fc"],
  },

  "strasbourg": {
    teamKey: "strasbourg",
    name: "Strasbourg",
    country: FRANCE,
    city: "Strasbourg",
    leagueId: LIGUE_1,
    aliases: ["rc strasbourg", "racing"],
  },

  "toulouse": {
    teamKey: "toulouse",
    name: "Toulouse",
    country: FRANCE,
    city: "Toulouse",
    leagueId: LIGUE_1,
    aliases: ["tfc", "toulouse fc"],
  },
};

/**
 * Deterministic resolver:
 * - matches canonical team keys
 * - matches aliases
 * - diacritics-safe and punctuation-safe
 *
 * Returns the canonical teamKey (e.g. "bayern-munich") or null.
 */
let _aliasToTeamKey: Map<string, string> | null = null;

function buildAliasMap(): Map<string, string> {
  const map = new Map<string, string>();

  Object.values(teams).forEach((t) => {
    const canonical = normalizeTeamKey(t.teamKey);
    if (canonical) map.set(canonical, t.teamKey);

    const nameKey = normalizeTeamKey(t.name);
    if (nameKey) map.set(nameKey, t.teamKey);

    (t.aliases ?? []).forEach((a) => {
      const k = normalizeTeamKey(a);
      if (!k) return;
      // first write wins (deterministic)
      if (!map.has(k)) map.set(k, t.teamKey);
    });
  });

  return map;
}

export function resolveTeamKey(input: string): string | null {
  const k = normalizeTeamKey(input);
  if (!k) return null;

  if (!_aliasToTeamKey) _aliasToTeamKey = buildAliasMap();
  return _aliasToTeamKey.get(k) ?? null;
}

export function getTeam(teamInput: string): TeamRecord | null {
  const resolved = resolveTeamKey(teamInput);
  const key = resolved ? normalizeTeamKey(resolved) : normalizeTeamKey(teamInput);
  return teams[key] ?? null;
}

/**
 * Search helper (V1): returns a scored list based on name/aliases.
 */
export function searchTeams(query: string, limit = 10): TeamRecord[] {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];

  const list = Object.values(teams);

  const scored = list
    .map((t) => {
      const name = t.name.toLowerCase();
      const aliases = (t.aliases ?? []).map((a) => a.toLowerCase());

      let score = 0;

      if (name === q) score += 100;
      if (aliases.includes(q)) score += 95;

      if (name.startsWith(q)) score += 70;
      if (aliases.some((a) => a.startsWith(q))) score += 60;

      if (name.includes(q)) score += 35;
      if (aliases.some((a) => a.includes(q))) score += 25;

      if (t.leagueId) score += 5;

      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit))
    .map((x) => x.t);

  return scored;
}

/**
 * Utility: attempt to infer league option for a team (if linked)
 */
export function leagueForTeam(t: TeamRecord): LeagueOption | null {
  if (!t.leagueId) return null;
  const match = LEAGUES.find((l) => l.leagueId === t.leagueId);
  if (!match) return null;

  const season = typeof t.season === "number" ? t.season : match.season;
  return { ...match, season };
}

export default teams;
