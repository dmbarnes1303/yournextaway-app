// src/data/teamGuides/index.ts
import type { TeamGuide } from "./types";
import { normalizeTeamKey, resolveTeamKey } from "@/src/data/teams";

import { premierLeagueTeamGuides } from "./premierLeague";
import { laLigaTeamGuides } from "./laLiga";
import { serieATeamGuides } from "./serieA";
import { bundesligaTeamGuides } from "./bundesliga";
import { ligue1TeamGuides } from "./ligue1";

/**
 * Team Guide registry + helpers.
 *
 * Source of truth rules (V1):
 * - Canonical team identity is `teamKey` in src/data/teams.
 * - A guide is considered "available" ONLY if we can resolve input -> teamKey and that key exists in this registry.
 * - Never rely on raw names from fixtures/API for direct lookup.
 */

export const teamGuides: Record<string, TeamGuide> = {
  ...premierLeagueTeamGuides,
  ...laLigaTeamGuides,
  ...serieATeamGuides,
  ...bundesligaTeamGuides,
  ...ligue1TeamGuides,
};

/**
 * Re-export so consumers can use the SAME normalisation.
 */
export { normalizeTeamKey };

/**
 * Resolve any user/API input into the canonical teamKey (if possible), then fetch guide.
 */
export function getTeamGuide(teamInput: string): TeamGuide | null {
  const key = resolveTeamKey(teamInput) ?? normalizeTeamKey(teamInput);
  return teamGuides[key] ?? null;
}

/**
 * Convenience helper for UI: whether a guide exists.
 * IMPORTANT: uses resolveTeamKey so "PSG", "Paris SG", etc still count as available.
 */
export function hasTeamGuide(teamInput: string): boolean {
  const key = resolveTeamKey(teamInput) ?? normalizeTeamKey(teamInput);
  return !!teamGuides[key];
}

/**
 * Default export MUST be compatible with both patterns:
 * 1) Default import used as a plain registry map: guides["arsenal"]
 * 2) Callers treating it like a module object: guides.normalizeTeamKey(...)
 */
const teamGuidesModule = Object.assign(teamGuides, {
  normalizeTeamKey,
  resolveTeamKey,
  getTeamGuide,
  hasTeamGuide,
});

export default teamGuidesModule;
