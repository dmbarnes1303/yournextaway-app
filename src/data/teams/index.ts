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

/**
 * Registry keyed by teamKey.
 * Populate this as you build guides.
 */
export const teams: Record<string, TeamRecord> = {
  // Example entries (keep or delete; safe to leave)
  // "arsenal": {
  //   teamKey: "arsenal",
  //   name: "Arsenal",
  //   country: "England",
  //   city: "London",
  //   leagueId: 39,
  //   aliases: ["arsenal fc", "gunners"],
  // },
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
