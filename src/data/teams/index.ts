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
 * - Add aliases for common user inputs (e.g. "spurs", "man utd", "inter", "psg").
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

/**
 * Normalise any user input or label into a comparable key.
 * Keep it simple and predictable for V1.
 */
export function normalizeTeamKey(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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
 * Registry keyed by teamKey.
 *
 * Gold standard:
 * - Alphabetical by teamKey
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

  "as-roma": {
    teamKey: "as-roma",
    name: "AS Roma",
    country: ITALY,
    city: "Rome",
    leagueId: SERIE_A,
    aliases: ["roma", "a.s. roma", "giallorossi"],
  },

  "augsburg": {
    teamKey: "augsburg",
    name: "Augsburg",
    country: GERMANY,
    city: "Augsburg",
    leagueId: BUNDESLIGA,
    aliases: ["fc augsburg", "fca"],
  },

  "auxerre": {
    teamKey: "auxerre",
    name: "Auxerre",
    country: FRANCE,
    city: "Auxerre",
    leagueId: LIGUE_1,
    aliases: ["aj auxerre", "aja"],
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
    aliases: ["bayern", "fc bayern", "fcb"],
  },

  "barcelona": {
    teamKey: "barcelona",
    name: "Barcelona",
    country: SPAIN,
    city: "Barcelona",
    leagueId: LALIGA,
    aliases: ["barca", "fc barcelona"],
  },

  "bologna": {
    teamKey: "bologna",
    name: "Bologna",
    country: ITALY,
    city: "Bologna",
    leagueId: SERIE_A,
    aliases: ["bologna fc", "rossoblu"],
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
    aliases: ["gladbach", "bmg", "borussia mönchengladbach"],
  },

  "brentford": {
    teamKey: "brentford",
    name: "Brentford",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["brentford fc", "the bees", "bees"],
  },

  "brest": {
    teamKey: "brest",
    name: "Brest",
    country: FRANCE,
    city: "Brest",
    leagueId: LIGUE_1,
    aliases: ["stade brestois", "stade brestois 29"],
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

  "cagliari": {
    teamKey: "cagliari",
    name: "Cagliari",
    country: ITALY,
    city: "Cagliari",
    leagueId: SERIE_A,
    aliases: ["cagliari calcio"],
  },

  "celta-vigo": {
    teamKey: "celta-vigo",
    name: "Celta Vigo",
    country: SPAIN,
    city: "Vigo",
    leagueId: LALIGA,
    aliases: ["celta", "rc celta", "celta de vigo"],
  },

  "chelsea": {
    teamKey: "chelsea",
    name: "Chelsea",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["chelsea fc", "the blues", "blues"],
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

  "crystal-palace": {
    teamKey: "crystal-palace",
    name: "Crystal Palace",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["palace", "crystal palace fc", "eagles", "the eagles"],
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

  "eintracht-frankfurt": {
    teamKey: "eintracht-frankfurt",
    name: "Eintracht Frankfurt",
    country: GERMANY,
    city: "Frankfurt",
    leagueId: BUNDESLIGA,
    aliases: ["frankfurt", "sge", "eintracht"],
  },

  "espanyol": {
    teamKey: "espanyol",
    name: "Espanyol",
    country: SPAIN,
    city: "Barcelona",
    leagueId: LALIGA,
    aliases: ["rcd espanyol", "espanyol barcelona"],
  },

  "everton": {
    teamKey: "everton",
    name: "Everton",
    country: ENGLAND,
    city: "Liverpool",
    leagueId: EPL,
    aliases: ["everton fc", "the toffees", "toffees"],
  },

  "fc-cologne": {
    teamKey: "fc-cologne",
    name: "FC Cologne",
    country: GERMANY,
    city: "Cologne",
    leagueId: BUNDESLIGA,
    aliases: ["koln", "köln", "1. fc koln", "1 fc koln"],
  },

  "fc-heidenheim": {
    teamKey: "fc-heidenheim",
    name: "FC Heidenheim",
    country: GERMANY,
    city: "Heidenheim",
    leagueId: BUNDESLIGA,
    aliases: ["heidenheim", "fch", "1. fc heidenheim"],
  },

  "fiorentina": {
    teamKey: "fiorentina",
    name: "Fiorentina",
    country: ITALY,
    city: "Florence",
    leagueId: SERIE_A,
    aliases: ["acf fiorentina", "viola"],
  },

  "freiburg": {
    teamKey: "freiburg",
    name: "Freiburg",
    country: GERMANY,
    city: "Freiburg",
    leagueId: BUNDESLIGA,
    aliases: ["sc freiburg", "scf"],
  },

  "fulham": {
    teamKey: "fulham",
    name: "Fulham",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["fulham fc", "the cottagers", "cottagers"],
  },

  "genoa": {
    teamKey: "genoa",
    name: "Genoa",
    country: ITALY,
    city: "Genoa",
    leagueId: SERIE_A,
    aliases: ["genoa cfc", "grifone"],
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

  "hamburger-sv": {
    teamKey: "hamburger-sv",
    name: "Hamburger SV",
    country: GERMANY,
    city: "Hamburg",
    leagueId: BUNDESLIGA,
    aliases: ["hsv", "hamburg"],
  },

  "hellas-verona": {
    teamKey: "hellas-verona",
    name: "Hellas Verona",
    country: ITALY,
    city: "Verona",
    leagueId: SERIE_A,
    aliases: ["verona", "hellas"],
  },

  "hoffenheim": {
    teamKey: "hoffenheim",
    name: "Hoffenheim",
    country: GERMANY,
    city: "Sinsheim",
    leagueId: BUNDESLIGA,
    aliases: ["tsg hoffenheim", "tsg 1899", "hoffenheim 1899"],
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

  "le-havre": {
    teamKey: "le-havre",
    name: "Le Havre",
    country: FRANCE,
    city: "Le Havre",
    leagueId: LIGUE_1,
    aliases: ["le havre ac", "hac"],
  },

  "lecco": {
    teamKey: "lecco",
    name: "Lecce",
    country: ITALY,
    city: "Lecce",
    leagueId: SERIE_A,
    aliases: ["us lecce"],
  },

  "leeds-united": {
    teamKey: "leeds-united",
    name: "Leeds United",
    country: ENGLAND,
    city: "Leeds",
    leagueId: EPL,
    aliases: ["leeds", "leeds utd", "leeds united fc", "lufc"],
  },

  "lens": {
    teamKey: "lens",
    name: "Lens",
    country: FRANCE,
    city: "Lens",
    leagueId: LIGUE_1,
    aliases: ["rc lens", "rcl"],
  },

  "levante": {
    teamKey: "levante",
    name: "Levante",
    country: SPAIN,
    city: "Valencia",
    leagueId: LALIGA,
    aliases: ["levante ud"],
  },

  "lille": {
    teamKey: "lille",
    name: "Lille",
    country: FRANCE,
    city: "Lille",
    leagueId: LIGUE_1,
    aliases: ["losc", "lille osc"],
  },

  "liverpool": {
    teamKey: "liverpool",
    name: "Liverpool",
    country: ENGLAND,
    city: "Liverpool",
    leagueId: EPL,
    aliases: ["liverpool fc", "lfc", "the reds", "reds"],
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

  "mainz-05": {
    teamKey: "mainz-05",
    name: "Mainz 05",
    country: GERMANY,
    city: "Mainz",
    leagueId: BUNDESLIGA,
    aliases: ["mainz", "fsv mainz", "1. fsv mainz 05"],
  },

  "mallorca": {
    teamKey: "mallorca",
    name: "Mallorca",
    country: SPAIN,
    city: "Palma",
    leagueId: LALIGA,
    aliases: ["rcd mallorca"],
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

  "napoli": {
    teamKey: "napoli",
    name: "Napoli",
    country: ITALY,
    city: "Naples",
    leagueId: SERIE_A,
    aliases: ["ssc napoli"],
  },

  "newcastle-united": {
    teamKey: "newcastle-united",
    name: "Newcastle United",
    country: ENGLAND,
    city: "Newcastle upon Tyne",
    leagueId: EPL,
    aliases: ["newcastle", "newcastle utd", "nufc", "toon", "the toon"],
  },

  "nice": {
    teamKey: "nice",
    name: "Nice",
    country: FRANCE,
    city: "Nice",
    leagueId: LIGUE_1,
    aliases: ["ogc nice"],
  },

  "nottingham-forest": {
    teamKey: "nottingham-forest",
    name: "Nottingham Forest",
    country: ENGLAND,
    city: "Nottingham",
    leagueId: EPL,
    aliases: ["forest", "notts forest", "nottingham forest fc", "nffc"],
  },

  "osasuna": {
    teamKey: "osasuna",
    name: "Osasuna",
    country: SPAIN,
    city: "Pamplona",
    leagueId: LALIGA,
    aliases: ["ca osasuna"],
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

  "rayo-vallecano": {
    teamKey: "rayo-vallecano",
    name: "Rayo Vallecano",
    country: SPAIN,
    city: "Madrid",
    leagueId: LALIGA,
    aliases: ["rayo", "rayo vallecano"],
  },

  "rb-leipzig": {
    teamKey: "rb-leipzig",
    name: "RB Leipzig",
    country: GERMANY,
    city: "Leipzig",
    leagueId: BUNDESLIGA,
    aliases: ["leipzig", "rasenballsport leipzig"],
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

  "rennes": {
    teamKey: "rennes",
    name: "Rennes",
    country: FRANCE,
    city: "Rennes",
    leagueId: LIGUE_1,
    aliases: ["stade rennais", "stade rennais fc"],
  },

  "sassuolo": {
    teamKey: "sassuolo",
    name: "Sassuolo",
    country: ITALY,
    city: "Sassuolo",
    leagueId: SERIE_A,
    aliases: ["u.s. sassuolo", "sassuolo calcio"],
  },

  "sevilla": {
    teamKey: "sevilla",
    name: "Sevilla",
    country: SPAIN,
    city: "Seville",
    leagueId: LALIGA,
    aliases: ["sevilla fc"],
  },

  "st-pauli": {
    teamKey: "st-pauli",
    name: "St. Pauli",
    country: GERMANY,
    city: "Hamburg",
    leagueId: BUNDESLIGA,
    aliases: ["fc st pauli", "st pauli"],
  },

  "strasbourg": {
    teamKey: "strasbourg",
    name: "Strasbourg",
    country: FRANCE,
    city: "Strasbourg",
    leagueId: LIGUE_1,
    aliases: ["rc strasbourg", "racing"],
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

  "torino": {
    teamKey: "torino",
    name: "Torino",
    country: ITALY,
    city: "Turin",
    leagueId: SERIE_A,
    aliases: ["torino fc", "il toro"],
  },

  "toulouse": {
    teamKey: "toulouse",
    name: "Toulouse",
    country: FRANCE,
    city: "Toulouse",
    leagueId: LIGUE_1,
    aliases: ["tfc", "toulouse fc"],
  },

  "udinese": {
    teamKey: "udinese",
    name: "Udinese",
    country: ITALY,
    city: "Udine",
    leagueId: SERIE_A,
    aliases: ["udinese calcio"],
  },

  "union-berlin": {
    teamKey: "union-berlin",
    name: "Union Berlin",
    country: GERMANY,
    city: "Berlin",
    leagueId: BUNDESLIGA,
    aliases: ["union", "fc union", "1. fc union berlin"],
  },

  "valencia": {
    teamKey: "valencia",
    name: "Valencia",
    country: SPAIN,
    city: "Valencia",
    leagueId: LALIGA,
    aliases: ["valencia cf"],
  },

  "vfb-stuttgart": {
    teamKey: "vfb-stuttgart",
    name: "VfB Stuttgart",
    country: GERMANY,
    city: "Stuttgart",
    leagueId: BUNDESLIGA,
    aliases: ["stuttgart", "vfb"],
  },

  "villarreal": {
    teamKey: "villarreal",
    name: "Villarreal",
    country: SPAIN,
    city: "Villarreal",
    leagueId: LALIGA,
    aliases: ["villarreal cf", "yellow submarine"],
  },

  "werder-bremen": {
    teamKey: "werder-bremen",
    name: "Werder Bremen",
    country: GERMANY,
    city: "Bremen",
    leagueId: BUNDESLIGA,
    aliases: ["werder", "sv werder bremen"],
  },

  "west-ham-united": {
    teamKey: "west-ham-united",
    name: "West Ham United",
    country: ENGLAND,
    city: "London",
    leagueId: EPL,
    aliases: ["west ham", "whu", "whufc", "hammers", "the hammers"],
  },

  "wolfsburg": {
    teamKey: "wolfsburg",
    name: "Wolfsburg",
    country: GERMANY,
    city: "Wolfsburg",
    leagueId: BUNDESLIGA,
    aliases: ["vfl wolfsburg", "vfl"],
  },

  "wolves": {
    teamKey: "wolves",
    name: "Wolverhampton Wanderers",
    country: ENGLAND,
    city: "Wolverhampton",
    leagueId: EPL,
    aliases: ["wolverhampton", "wolverhampton wanderers", "wolves fc", "wwfc"],
  },
};

export function getTeam(teamInput: string): TeamRecord | null {
  const key = normalizeTeamKey(teamInput);
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

      // Slight boost if team has league linkage (more actionable)
      if (t.leagueId) score += 5;

      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
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
