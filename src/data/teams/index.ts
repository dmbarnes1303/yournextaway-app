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
 * - Keep this registry minimal in V1 (top leagues + what you actually support).
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

const EPL_LEAGUE_ID = 39;
const ENGLAND = "England";

/**
 * Registry keyed by teamKey.
 * Populated with 2025/26 Premier League clubs.
 */
export const teams: Record<string, TeamRecord> = {
  "afc-bournemouth": {
    teamKey: "afc-bournemouth",
    name: "AFC Bournemouth",
    country: ENGLAND,
    city: "Bournemouth",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["bournemouth", "bournemouth afc", "the cherries", "cherries"],
  },

  "arsenal": {
    teamKey: "arsenal",
    name: "Arsenal",
    country: ENGLAND,
    city: "London",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["arsenal fc", "gunners", "the gunners"],
  },

  "aston-villa": {
    teamKey: "aston-villa",
    name: "Aston Villa",
    country: ENGLAND,
    city: "Birmingham",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["villa", "aston villa fc"],
  },

  "brentford": {
    teamKey: "brentford",
    name: "Brentford",
    country: ENGLAND,
    city: "London",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["brentford fc", "the bees", "bees"],
  },

  "brighton-hove-albion": {
    teamKey: "brighton-hove-albion",
    name: "Brighton & Hove Albion",
    country: ENGLAND,
    city: "Brighton",
    leagueId: EPL_LEAGUE_ID,
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
    leagueId: EPL_LEAGUE_ID,
    aliases: ["burnley fc", "clarets", "the clarets"],
  },

  "chelsea": {
    teamKey: "chelsea",
    name: "Chelsea",
    country: ENGLAND,
    city: "London",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["chelsea fc", "the blues", "blues"],
  },

  "crystal-palace": {
    teamKey: "crystal-palace",
    name: "Crystal Palace",
    country: ENGLAND,
    city: "London",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["palace", "crystal palace fc", "eagles", "the eagles"],
  },

  "everton": {
    teamKey: "everton",
    name: "Everton",
    country: ENGLAND,
    city: "Liverpool",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["everton fc", "the toffees", "toffees"],
  },

  "fulham": {
    teamKey: "fulham",
    name: "Fulham",
    country: ENGLAND,
    city: "London",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["fulham fc", "the cottagers", "cottagers"],
  },

  "leeds-united": {
    teamKey: "leeds-united",
    name: "Leeds United",
    country: ENGLAND,
    city: "Leeds",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["leeds", "leeds utd", "leeds united fc", "lufc"],
  },

  "liverpool": {
    teamKey: "liverpool",
    name: "Liverpool",
    country: ENGLAND,
    city: "Liverpool",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["liverpool fc", "lfc", "the reds", "reds"],
  },

  "manchester-city": {
    teamKey: "manchester-city",
    name: "Manchester City",
    country: ENGLAND,
    city: "Manchester",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["man city", "manchester city fc", "mcfc", "city"],
  },

  "manchester-united": {
    teamKey: "manchester-united",
    name: "Manchester United",
    country: ENGLAND,
    city: "Manchester",
    leagueId: EPL_LEAGUE_ID,
    aliases: [
      "man utd",
      "man united",
      "manchester united fc",
      "mufc",
      "utd",
    ],
  },

  "newcastle-united": {
    teamKey: "newcastle-united",
    name: "Newcastle United",
    country: ENGLAND,
    city: "Newcastle upon Tyne",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["newcastle", "newcastle utd", "nufc", "toon", "the toon"],
  },

  "nottingham-forest": {
    teamKey: "nottingham-forest",
    name: "Nottingham Forest",
    country: ENGLAND,
    city: "Nottingham",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["forest", "notts forest", "nottingham forest fc", "nffc"],
  },

  "sunderland": {
    teamKey: "sunderland",
    name: "Sunderland",
    country: ENGLAND,
    city: "Sunderland",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["sunderland afc", "safc", "black cats", "the black cats"],
  },

  "tottenham-hotspur": {
    teamKey: "tottenham-hotspur",
    name: "Tottenham Hotspur",
    country: ENGLAND,
    city: "London",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["spurs", "tottenham", "tottenham hotspur fc", "thfc"],
  },

  "west-ham-united": {
    teamKey: "west-ham-united",
    name: "West Ham United",
    country: ENGLAND,
    city: "London",
    leagueId: EPL_LEAGUE_ID,
    aliases: ["west ham", "whu", "whufc", "hammers", "the hammers"],
  },

  "wolves": {
    teamKey: "wolves",
    name: "Wolverhampton Wanderers",
    country: ENGLAND,
    city: "Wolverhampton",
    leagueId: EPL_LEAGUE_ID,
    aliases: [
      "wolverhampton",
      "wolverhampton wanderers",
      "wolves fc",
      "wwfc",
      "wanderers",
    ],
  },

  "athletic-club": {
    teamKey: "athletic-club",
    name: "Athletic Club",
    country: "Spain",
    city: "Bilbao",
    leagueId: 140,
    aliases: ["athletic", "athletic bilbao", "bilbao"],
  },

  "atletico-madrid": {
    teamKey: "atletico-madrid",
    name: "Atlético Madrid",
    country: "Spain",
    city: "Madrid",
    leagueId: 140,
    aliases: ["atletico", "atleti", "atletico madrid"],
  },

  "barcelona": {
    teamKey: "barcelona",
    name: "Barcelona",
    country: "Spain",
    city: "Barcelona",
    leagueId: 140,
    aliases: ["barca", "fc barcelona"],
  },

  "celta-vigo": {
    teamKey: "celta-vigo",
    name: "Celta Vigo",
    country: "Spain",
    city: "Vigo",
    leagueId: 140,
    aliases: ["celta", "rc celta", "celta de vigo"],
  },

  "deportivo-alaves": {
    teamKey: "deportivo-alaves",
    name: "Deportivo Alavés",
    country: "Spain",
    city: "Vitoria-Gasteiz",
    leagueId: 140,
    aliases: ["alaves", "alavés", "deportivo alaves"],
  },

  "elche": {
    teamKey: "elche",
    name: "Elche",
    country: "Spain",
    city: "Elche",
    leagueId: 140,
    aliases: ["elche cf"],
  },

  "espanyol": {
    teamKey: "espanyol",
    name: "Espanyol",
    country: "Spain",
    city: "Barcelona",
    leagueId: 140,
    aliases: ["rcd espanyol", "espanyol barcelona"],
  },

  "getafe": {
    teamKey: "getafe",
    name: "Getafe",
    country: "Spain",
    city: "Getafe",
    leagueId: 140,
    aliases: ["getafe cf"],
  },

  "girona": {
    teamKey: "girona",
    name: "Girona",
    country: "Spain",
    city: "Girona",
    leagueId: 140,
    aliases: ["girona fc"],
  },

  "levante": {
    teamKey: "levante",
    name: "Levante",
    country: "Spain",
    city: "Valencia",
    leagueId: 140,
    aliases: ["levante ud"],
  },

  "mallorca": {
    teamKey: "mallorca",
    name: "Mallorca",
    country: "Spain",
    city: "Palma",
    leagueId: 140,
    aliases: ["rcd mallorca"],
  },

  "osasuna": {
    teamKey: "osasuna",
    name: "Osasuna",
    country: "Spain",
    city: "Pamplona",
    leagueId: 140,
    aliases: ["ca osasuna"],
  },

  "rayo-vallecano": {
    teamKey: "rayo-vallecano",
    name: "Rayo Vallecano",
    country: "Spain",
    city: "Madrid",
    leagueId: 140,
    aliases: ["rayo", "rayo vallecano"],
  },

  "real-betis": {
    teamKey: "real-betis",
    name: "Real Betis",
    country: "Spain",
    city: "Seville",
    leagueId: 140,
    aliases: ["betis", "real betis balompie"],
  },

  "real-madrid": {
    teamKey: "real-madrid",
    name: "Real Madrid",
    country: "Spain",
    city: "Madrid",
    leagueId: 140,
    aliases: ["madrid", "rm", "real madrid cf"],
  },

  "real-oviedo": {
    teamKey: "real-oviedo",
    name: "Real Oviedo",
    country: "Spain",
    city: "Oviedo",
    leagueId: 140,
    aliases: ["oviedo"],
  },

  "real-sociedad": {
    teamKey: "real-sociedad",
    name: "Real Sociedad",
    country: "Spain",
    city: "San Sebastián",
    leagueId: 140,
    aliases: ["sociedad", "la real"],
  },

  "sevilla": {
    teamKey: "sevilla",
    name: "Sevilla",
    country: "Spain",
    city: "Seville",
    leagueId: 140,
    aliases: ["sevilla fc"],
  },

  "valencia": {
    teamKey: "valencia",
    name: "Valencia",
    country: "Spain",
    city: "Valencia",
    leagueId: 140,
    aliases: ["valencia cf"],
  },

  "villarreal": {
    teamKey: "villarreal",
    name: "Villarreal",
    country: "Spain",
    city: "Villarreal",
    leagueId: 140,
    aliases: ["villarreal cf", "yellow submarine"],
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

