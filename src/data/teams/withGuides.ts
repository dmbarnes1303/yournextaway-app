// src/data/teams/withGuides.ts
import {
  teams,
  getTeam,
  searchTeams,
  normalizeTeamKey,
  type TeamRecord,
} from "./index";
import { getTeamGuide, hasTeamGuide } from "@/src/data/teamGuides";
import type { TeamGuide } from "@/src/data/teamGuides/types";

export type TeamRecordWithGuide = TeamRecord & {
  hasGuide: boolean;
  guide?: TeamGuide;
};

function attachGuide(
  team: TeamRecord,
  includeGuide: boolean
): TeamRecordWithGuide {
  const key = normalizeTeamKey(team.teamKey);
  const guide = includeGuide ? getTeamGuide(key) : null;

  return {
    ...team,
    hasGuide: hasTeamGuide(key),
    ...(guide ? { guide } : {}),
  };
}

/**
 * Join a single team with guide metadata.
 * Safe lookup path:
 * - resolve via teams registry
 * - normalize key
 * - attach guide if available
 */
export function getTeamWithGuide(
  teamInput: string,
  includeGuide = true
): TeamRecordWithGuide | null {
  const team = getTeam(teamInput);
  if (!team) return null;

  return attachGuide(team, includeGuide);
}

/**
 * Search teams and attach guide presence.
 * Default keeps payload lighter by not attaching full guide bodies.
 */
export function searchTeamsWithGuide(
  query: string,
  limit = 10,
  includeGuide = false
): TeamRecordWithGuide[] {
  return searchTeams(query, limit).map((team) => attachGuide(team, includeGuide));
}

/**
 * All teams with guide metadata.
 * Useful for audit screens, league checks, and completeness passes.
 */
export function allTeamsWithGuide(
  includeGuide = false
): TeamRecordWithGuide[] {
  return Object.values(teams).map((team) => attachGuide(team, includeGuide));
}

/**
 * Convenience helpers for audits.
 */
export function getTeamsMissingGuides(): TeamRecord[] {
  return Object.values(teams).filter(
    (team) => !hasTeamGuide(normalizeTeamKey(team.teamKey))
  );
}

export function getTeamsWithGuides(): TeamRecordWithGuide[] {
  return Object.values(teams)
    .filter((team) => hasTeamGuide(normalizeTeamKey(team.teamKey)))
    .map((team) => attachGuide(team, true));
}

export function getTeamGuideCoverageSnapshot() {
  const all = Object.values(teams);
  const withGuide = all.filter((team) =>
    hasTeamGuide(normalizeTeamKey(team.teamKey))
  );
  const missing = all.filter(
    (team) => !hasTeamGuide(normalizeTeamKey(team.teamKey))
  );

  return {
    totalTeams: all.length,
    withGuideCount: withGuide.length,
    missingGuideCount: missing.length,
    missingGuides: missing.map((team) => ({
      teamKey: team.teamKey,
      name: team.name,
      country: team.country,
      city: team.city,
      leagueId: team.leagueId,
      stadiumKey: team.stadiumKey,
    })),
  };
}
