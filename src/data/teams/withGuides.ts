// src/data/teams/withGuides.ts
import { teams, getTeam, searchTeams, normalizeTeamKey, type TeamRecord } from "./index";
import { getTeamGuide, hasTeamGuide } from "@/src/data/teamGuides";
import type { TeamGuide } from "@/src/data/teamGuides/types";

export type TeamRecordWithGuide = TeamRecord & {
  hasGuide: boolean;
  guide?: TeamGuide;
};

/**
 * Join a team with its guide (if present).
 * Safe: no circular imports because this file is the only place that imports both registries.
 */
export function getTeamWithGuide(teamInput: string): TeamRecordWithGuide | null {
  const t = getTeam(teamInput);
  if (!t) return null;

  const key = normalizeTeamKey(t.teamKey);
  const guide = getTeamGuide(key);

  return {
    ...t,
    hasGuide: !!guide,
    ...(guide ? { guide } : {}),
  };
}

/**
 * Search teams and attach "hasGuide" (and optionally the guide).
 * Default: DO NOT attach the full guide bodies (keeps UI lists fast).
 */
export function searchTeamsWithGuide(
  query: string,
  limit = 10,
  includeGuide = false
): TeamRecordWithGuide[] {
  const results = searchTeams(query, limit);

  if (!includeGuide) {
    return results.map((t) => ({
      ...t,
      hasGuide: hasTeamGuide(t.teamKey),
    }));
  }

  return results.map((t) => {
    const guide = getTeamGuide(t.teamKey);
    return {
      ...t,
      hasGuide: !!guide,
      ...(guide ? { guide } : {}),
    };
  });
}

/**
 * Get all teams (useful for league pages) with guide flags.
 */
export function allTeamsWithGuide(includeGuide = false): TeamRecordWithGuide[] {
  const list = Object.values(teams);

  if (!includeGuide) {
    return list.map((t) => ({
      ...t,
      hasGuide: hasTeamGuide(t.teamKey),
    }));
  }

  return list.map((t) => {
    const guide = getTeamGuide(t.teamKey);
    return {
      ...t,
      hasGuide: !!guide,
      ...(guide ? { guide } : {}),
    };
  });
}
